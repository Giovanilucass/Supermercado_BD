from servicos.database.conector import DatabaseManager
from datetime import datetime, timedelta, date

class GestaoProdutosEstoque:
    def __init__(self, db_provider):
        self.db = db_provider

    def get_produtos(self, categoria):
        query = "SELECT * FROM Produto"
        if categoria:
            query += f" WHERE Categoria ILIKE '{categoria}'"
        return self.db.execute_select_all(query)

    
    def get_produtos_estoque_baixo(self, limite_estoque:int):
        query = "SELECT Nome, Estoque, Codigo FROM Produto"
        if limite_estoque>=0:
            query += f" WHERE Estoque < {limite_estoque}"
        return self.db.execute_select_all(query)

    def get_produtos_promocao(self):
        query = "SELECT Nome, Preco, Promocao FROM Produto WHERE Promocao IS NOT NULL"
        return self.db.execute_select_all(query)


    def get_produtos_por_fornecedor(self, cnpj):
        query = """
            SELECT P.Nome, P.Preco, F.Nome AS NomeFornecedor
            FROM Produto AS P
            JOIN Fornece ON P.Codigo = Fornece.Codigo_Produto
            JOIN Fornecedor AS F ON Fornece.CNPJ_Fornecedor = F.CNPJ
        """
        if cnpj:
            query+=f"WHERE Fornece.CNPJ_Fornecedor = '{cnpj}'"
        return self.db.execute_select_all(query)
    
 
    #não sei se esta funcionando a parte de colocar as variaveis, a consulta padrão esta funcionando 
    def get_produto_mais_vendido(self, data_inicial=None, data_final=None):
        query = """
            SELECT Produto.Nome, SUM(Abarca.Quantidade) AS QuantidadeVendida
            FROM Produto
            INNER JOIN Abarca ON Produto.Codigo = Abarca.Codigo_produto
            INNER JOIN Compra ON Compra.NF = Abarca.NF_Compra
        """
        params = []
        if data_inicial and data_final:
            query += " WHERE Compra.Data_Hora BETWEEN CAST(%s AS TIMESTAMP) AND CAST(%s AS TIMESTAMP)"
            params = [data_inicial, data_final]
    
        else:
            #consulta de últimos 30 dias 
            data_final = datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            data_inicial = (datetime.today() - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
            query += " WHERE Compra.Data_Hora BETWEEN CAST(%s AS TIMESTAMP) AND CAST(%s AS TIMESTAMP)"
            params = [data_inicial, data_final]

        query += """
            GROUP BY Produto.Nome
            ORDER BY QuantidadeVendida DESC
            LIMIT 1
        """
        return self.db.execute_select_all(query, params)    
        

   
    





            
