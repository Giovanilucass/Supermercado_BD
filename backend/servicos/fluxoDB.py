import psycopg2
from datetime import datetime
from servicos.database.conector import DatabaseManager

class fluxoDB:
    def __init__(self):
        self.db = DatabaseManager()

    def _converter_data(self, data_str):
        if not data_str: return None
        try:
            return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            return None

    def _limpar_moeda(self, valor_str):
        if not valor_str: return 0.00
        # Se for float, já retorna
        if isinstance(valor_str, (int, float)): return valor_str
        # Limpa R$, espaços e pontos
        return float(str(valor_str).replace("R$", "").replace(" ", "").replace(".", "").replace(",", "."))

    # --- LISTAGEM DO FLUXO UNIFICADO ---
    def buscar_fluxo(self, nf=None, valor_min=None, valor_max=None, data_min=None, data_max=None):
        con = self.db.conn
        cursor = con.cursor()

        # Vamos usar UNION ALL para juntar Vendas (Entrada de $$) e Compras (Saída de $$)
        # Tipo 'E' = Entrada (Venda ao Cliente)
        # Tipo 'S' = Saída (Pagamento ao Fornecedor)
        
        sql = """
            SELECT * FROM (
                -- Vendas ao Cliente (Dinheiro Entrando)
                SELECT 
                    c.NF, 
                    to_char(c.Data_Hora, 'YYYY-MM-DD HH24:MI:SS') as data_hora,
                    'Venda ao Cliente' as origem,
                    c.Valor_Total as valor,
                    'E' as tipo
                FROM Compra_Cliente c
                
                UNION ALL
                
                -- Compras de Fornecedor (Dinheiro Saindo)
                SELECT 
                    v.NF, 
                    to_char(v.Data_Hora, 'YYYY-MM-DD HH24:MI:SS') as data_hora,
                    f.Nome as origem,
                    v.Preco as valor,
                    'S' as tipo
                FROM Venda_Fornecedor v
                JOIN Fornecedor f ON v.CNPJ_Fornecedor = f.CNPJ
            ) as fluxo
            WHERE 1=1
        """
        params = []

        if nf:
            # NF é BIGINT, garantimos que é numérico
            sql += " AND fluxo.NF = %s"
            params.append(nf)

        if valor_min:
            sql += " AND fluxo.valor >= %s"
            params.append(self._limpar_moeda(valor_min))

        if valor_max:
            sql += " AND fluxo.valor <= %s"
            params.append(self._limpar_moeda(valor_max))

        if data_min:
            dt = self._converter_data(data_min)
            if dt:
                sql += " AND DATE(fluxo.data_hora) >= %s"
                params.append(dt)

        if data_max:
            dt = self._converter_data(data_max)
            if dt:
                sql += " AND DATE(fluxo.data_hora) <= %s"
                params.append(dt)

        sql += " ORDER BY fluxo.data_hora DESC"

        cursor.execute(sql, tuple(params))
        colunas = [desc[0] for desc in cursor.description]
        resultados = [dict(zip(colunas, row)) for row in cursor.fetchall()]

        # Calcular Totais para os Cards
        total_entradas = sum(item['valor'] for item in resultados if item['tipo'] == 'E')
        total_saidas = sum(item['valor'] for item in resultados if item['tipo'] == 'S')
        lucro = total_entradas - total_saidas

        return {
            "lista": resultados,
            "resumo": {
                "total_entradas": total_entradas,
                "total_saidas": total_saidas,
                "lucro": lucro
            }
        }

    # --- DETALHES DA TRANSAÇÃO (MODAL) ---
    def get_detalhes_transacao(self, nf, tipo):
        con = self.db.conn
        cursor = con.cursor()
        
        if tipo == 'E': # Entrada (Venda ao Cliente)
            # 1. Dados da Nota
            cursor.execute("""
                SELECT c.NF, to_char(c.Data_Hora, 'YYYY-MM-DD HH24:MI:SS'), c.Forma_Pagamento, 'Venda ao Cliente', c.Valor_Total
                FROM Compra_Cliente c WHERE c.NF = %s
            """, (nf,))
            nota = cursor.fetchone()
            if not nota: return None

            # 2. Itens (Tabela Abarca)
            cursor.execute("""
                SELECT p.Nome, a.Quantidade, p.Preco
                FROM Abarca a
                JOIN Produto p ON a.Codigo_Produto = p.Codigo
                WHERE a.NF_Compra_Cliente = %s
            """, (nf,))
            itens = [{"produto": row[0], "qtd": row[1], "preco": row[2]} for row in cursor.fetchall()]

        elif tipo == 'S': # Saída (Compra do Fornecedor)
            # 1. Dados da Nota
            cursor.execute("""
                SELECT v.NF, to_char(v.Data_Hora, 'YYYY-MM-DD HH24:MI:SS'), 'Boleto/Fatura', f.Nome, v.Preco
                FROM Venda_Fornecedor v
                JOIN Fornecedor f ON v.CNPJ_Fornecedor = f.CNPJ
                WHERE v.NF = %s
            """, (nf,))
            nota = cursor.fetchone()
            if not nota: return None

            # 2. Itens (Tabela Inclui)
            cursor.execute("""
                SELECT p.Nome, i.Quantidade, i.Preco_Venda_Fornecedor
                FROM Inclui i
                JOIN Produto p ON i.Codigo_Produto = p.Codigo
                WHERE i.NF_Venda_Fornecedor = %s
            """, (nf,))
            itens = [{"produto": row[0], "qtd": row[1], "preco": row[2]} for row in cursor.fetchall()]
        
        else:
            return None

        return {
            "nf": nota[0],
            "data_hora": nota[1],
            "forma_pagamento": nota[2],
            "origem": nota[3],
            "valor_total": nota[4],
            "itens": itens
        }