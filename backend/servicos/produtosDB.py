import psycopg2
from servicos.database.conector import DatabaseManager

class produtosDB:
    def __init__(self):
        self.db = DatabaseManager()

    def _limpar_moeda(self, valor_str):
        """Converte 'R$ 5,00' para 5.00"""
        if not valor_str: return 0.00
        if isinstance(valor_str, (int, float)): return float(valor_str)
        limpo = str(valor_str).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
        try:
            return float(limpo)
        except:
            return 0.00

    def buscar_produtos(self, nome=None, codigo=None, categoria=None, promocao=None, acabando=None, ordenacao="padrao"):
        con = self.db.conn
        cursor = con.cursor()

        if ordenacao == "mais_vendidos":
            sql = """
                SELECT p.Codigo, p.Nome, p.Preco, p.Estoque, p.Limite_inferior, p.Categoria, p.Promocao,
                       COALESCE(SUM(a.Quantidade), 0) as total_vendido
                FROM Produto p
                LEFT JOIN Abarca a ON p.Codigo = a.Codigo_Produto
                WHERE p.Ativo = TRUE
            """
        else:
            sql = """
                SELECT Codigo, Nome, Preco, Estoque, Limite_inferior, Categoria, Promocao
                FROM Produto
                WHERE Ativo = TRUE
            """
        
        params = []

        prefixo = "p." if ordenacao == "mais_vendidos" else ""

        if nome:
            sql += f" AND {prefixo}Nome ILIKE %s"
            params.append(f"%{nome}%")
        
        if codigo:
            sql += f" AND {prefixo}Codigo = %s"
            params.append(codigo)

        if categoria and categoria != "Todas as Categorias":
            sql += f" AND {prefixo}Categoria = %s"
            params.append(categoria)

        if promocao == "true":
            sql += f" AND {prefixo}Promocao > 0"

        if acabando == "true":
            sql += f" AND {prefixo}Estoque <= {prefixo}Limite_inferior"

        if ordenacao == "mais_vendidos":
            sql += " GROUP BY p.Codigo ORDER BY total_vendido DESC"
        elif ordenacao == "menor_preco":
            sql += f" ORDER BY {prefixo}Preco ASC"
        elif ordenacao == "maior_preco":
            sql += f" ORDER BY {prefixo}Preco DESC"
        else:
            sql += f" ORDER BY {prefixo}Nome ASC" # Padrão

        cursor.execute(sql, tuple(params))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    def get_produto_por_codigo(self, codigo):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute(
            "SELECT Codigo, Nome, Preco, Estoque, Limite_inferior, Categoria, Promocao FROM Produto WHERE Codigo = %s", 
            (codigo,)
        )
        res = cursor.fetchone()
        if not res: return None
        
        colunas = [desc[0] for desc in cursor.description]
        return dict(zip(colunas, res))

    def criar_produto(self, dados):
        nome = dados.get("nome")
        categoria = dados.get("categoria")
        preco = self._limpar_moeda(dados.get("preco"))
        estoque = int(dados.get("estoque", 0)) # Se vier vazio, assume 0
        # Limite inferior padrão pode ser 10 se não informado
        limite = int(dados.get("limite_inferior", 10)) 

        con = self.db.conn
        cursor = con.cursor()

        try:
            query = f"""
                INSERT INTO Produto (Nome, Preco, Estoque, Limite_inferior, Categoria, Promocao)
                VALUES ('{nome}', {preco}, {estoque}, {limite}, '{categoria}', 0)
            """
            cursor.execute(query)
            con.commit()
            return {"mensagem": "Produto cadastrado com sucesso!"}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar produto: {str(e)}"}

    def atualizar_produto(self, codigo, dados):
        nome = dados.get("nome")
        categoria = dados.get("categoria")
        preco = self._limpar_moeda(dados.get("preco"))
        promocao = int(dados.get("promocao", 0))
        estoque = int(dados.get("estoque"))
        
        con = self.db.conn
        cursor = con.cursor()

        try:
            query = f"""
                UPDATE Produto 
                SET Nome = '{nome}', 
                    Preco = {preco}, 
                    Categoria = '{categoria}', 
                    Promocao = {promocao},
                    Estoque = {estoque}
                WHERE Codigo = {codigo}
            """
            cursor.execute(query)
            con.commit()
            return {"mensagem": "Produto atualizado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao atualizar: {str(e)}"}

    def deletar_produto(self, codigo):
        # Como produtos têm histórico de vendas, NÃO usamos DELETE, usamos tipo um Soft Delete (Ativo = FALSE)
        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(f"UPDATE Produto SET Ativo = FALSE WHERE Codigo = {codigo}")
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Produto não encontrado."}

            return {"mensagem": "Produto removido do catálogo."}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao deletar: {str(e)}"}