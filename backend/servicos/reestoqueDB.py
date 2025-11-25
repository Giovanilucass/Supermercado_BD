import psycopg2
from datetime import datetime
from servicos.database.conector import DatabaseManager

class reestoqueDB:
    def __init__(self):
        self.db = DatabaseManager()

    def _limpar_moeda(self, valor_str):
        if not valor_str: return 0.00
        if isinstance(valor_str, (int, float)): return float(valor_str)
        return float(str(valor_str).replace("R$", "").replace(" ", "").replace(".", "").replace(",", "."))

    def _converter_data(self, data_str):
        if not data_str: return None
        try:
            return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            return None 

    def _limpar_cnpj(self, cnpj):
        return str(cnpj).replace(".", "").replace("-", "").replace("/", "")

    def buscar_entradas(self, termo_busca=None, data_min=None, data_max=None, valor_min=None, valor_max=None):
        con = self.db.conn
        cursor = con.cursor()

        sql = """
            SELECT 
                vf.NF, 
                to_char(vf.Data_Hora, 'YYYY-MM-DD HH24:MI:SS') as data_hora,
                f.Nome as nome_fornecedor,
                f.CNPJ as cnpj_fornecedor,
                p.Nome as nome_produto,
                p.Codigo as codigo_produto,
                i.Quantidade as qtd,
                vf.Preco as valor_total
            FROM Venda_Fornecedor vf
            JOIN Fornecedor f ON vf.CNPJ_Fornecedor = f.CNPJ
            JOIN Inclui i ON vf.NF = i.NF_Venda_Fornecedor
            JOIN Produto p ON i.Codigo_Produto = p.Codigo
            WHERE 1=1
        """
        params = []

        if termo_busca:
            termo = f"%{termo_busca}%"
            sql += """ AND (
                CAST(vf.NF as TEXT) LIKE %s OR 
                p.Nome ILIKE %s OR 
                f.Nome ILIKE %s
            )"""
            params.extend([termo, termo, termo])

        if data_min:
            dt = self._converter_data(data_min)
            if dt:
                sql += " AND DATE(vf.Data_Hora) >= %s"
                params.append(dt)

        if data_max:
            dt = self._converter_data(data_max)
            if dt:
                sql += " AND DATE(vf.Data_Hora) <= %s"
                params.append(dt)

        if valor_min:
            sql += " AND vf.Preco >= %s"
            params.append(self._limpar_moeda(valor_min))

        if valor_max:
            sql += " AND vf.Preco <= %s"
            params.append(self._limpar_moeda(valor_max))

        sql += " ORDER BY vf.Data_Hora DESC"

        cursor.execute(sql, tuple(params))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    def criar_entrada(self, dados):
        cnpj = dados.get("cnpj_fornecedor")
        nf_manual = dados.get("nf") 
        
        data_compra = self._converter_data(dados.get("data")) # DD/MM/YYYY
        hora_compra = dados.get("hora", "00:00")
        data_hora_iso = f"{data_compra} {hora_compra}:00"

        codigo_produto = dados.get("codigo_produto")
        qtd = int(dados.get("quantidade", 0))
        valor_total = self._limpar_moeda(dados.get("valor_total"))

        if qtd <= 0: return {"erro": "Quantidade deve ser maior que zero"}

        con = self.db.conn
        cursor = con.cursor()

        try:
            if nf_manual and str(nf_manual).isdigit():
                query_header = """
                    INSERT INTO Venda_Fornecedor (NF, Data_Hora, Preco, CNPJ_Fornecedor)
                    VALUES (%s, %s, %s, %s) RETURNING NF
                """
                cursor.execute(query_header, (nf_manual, data_hora_iso, valor_total, cnpj))
            else:
                query_header = """
                    INSERT INTO Venda_Fornecedor (Data_Hora, Preco, CNPJ_Fornecedor)
                    VALUES (%s, %s, %s) RETURNING NF
                """
                cursor.execute(query_header, (data_hora_iso, valor_total, cnpj))
            
            nf_gerada = cursor.fetchone()[0]

            preco_unitario = valor_total / qtd
            
            cursor.execute("""
                INSERT INTO Inclui (NF_Venda_Fornecedor, Codigo_Produto, Quantidade, Preco_Venda_Fornecedor)
                VALUES (%s, %s, %s, %s)
            """, (nf_gerada, codigo_produto, qtd, preco_unitario))

            cursor.execute("""
                UPDATE Produto 
                SET Estoque = Estoque + %s 
                WHERE Codigo = %s
            """, (qtd, codigo_produto))

            con.commit()
            return {"mensagem": "Entrada registrada!", "nf": nf_gerada}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao registrar entrada: {str(e)}"}

    def atualizar_entrada(self, nf_original, dados):
        nova_qtd = int(dados.get("quantidade"))
        novo_valor = self._limpar_moeda(dados.get("valor_total"))
        
        data_compra = self._converter_data(dados.get("data"))
        hora_compra = dados.get("hora", "00:00")
        novo_ts = f"{data_compra} {hora_compra}:00"

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute("SELECT Quantidade, Codigo_Produto FROM Inclui WHERE NF_Venda_Fornecedor = %s", (nf_original,))
            res = cursor.fetchone()
            if not res: return {"erro": "Registro não encontrado"}
            
            qtd_antiga = res[0]
            cod_prod = res[1]

            diferenca = nova_qtd - qtd_antiga
            
            cursor.execute("""
                UPDATE Venda_Fornecedor 
                SET Data_Hora = %s, Preco = %s 
                WHERE NF = %s
            """, (novo_ts, novo_valor, nf_original))

            novo_unitario = novo_valor / nova_qtd if nova_qtd > 0 else 0
            cursor.execute("""
                UPDATE Inclui 
                SET Quantidade = %s, Preco_Venda_Fornecedor = %s
                WHERE NF_Venda_Fornecedor = %s AND Codigo_Produto = %s
            """, (nova_qtd, novo_unitario, nf_original, cod_prod))

            cursor.execute("""
                UPDATE Produto 
                SET Estoque = GREATEST(0, Estoque + %s) 
                WHERE Codigo = %s
            """, (diferenca, cod_prod))

            con.commit()
            return {"mensagem": "Entrada atualizada com sucesso!"}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao atualizar: {str(e)}"}

    def deletar_entrada(self, nf):
        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute("SELECT Codigo_Produto, Quantidade FROM Inclui WHERE NF_Venda_Fornecedor = %s", (nf,))
            itens = cursor.fetchall()

            if not itens:
                return {"erro": "Nota não encontrada ou sem itens."}

            for item in itens:
                cod_prod, qtd = item
                cursor.execute("""
                    UPDATE Produto 
                    SET Estoque = GREATEST(0, Estoque - %s) 
                    WHERE Codigo = %s
                """, (qtd, cod_prod))

            cursor.execute("DELETE FROM Inclui WHERE NF_Venda_Fornecedor = %s", (nf,))
            cursor.execute("DELETE FROM Venda_Fornecedor WHERE NF = %s", (nf,))

            con.commit()
            return {"mensagem": "Registro de entrada excluído e estoque estornado."}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao deletar: {str(e)}"}