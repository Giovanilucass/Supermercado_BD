from servicos.database.conector import DatabaseManager

class fornecedoresDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getfornecedores(self, cnpj, nome, email):
        query ="SELECT * FROM fornecedor"
        return self.db.execute_select_all(query)
    
    def insere_fornecedores(self, cnpj, nome, email):
        statement = ""
        self.db.execute_statement(statement)
    

    def modifica_forenecedores(self, cnpj, nome, email):
        statement = ""
        self.db.execute_statement(statement)
        print(statement)