from servicos.database.conector import DatabaseManager

class produtosDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getprodutos(self, codigo, nome, categoria):
        query ="SELECT * FROM produto"
        return self.db.execute_select_all(query)
    
    def insere_produtos(self, codigo, nome, categoria):
        statement = ""
        self.db.execute_statement(statement)
    

    def modifica_produtos(self, codigo, nome, categoria):
        statement = ""
        self.db.execute_statement(statement)
        print(statement)