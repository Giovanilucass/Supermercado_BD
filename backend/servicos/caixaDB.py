from servicos.database.conector import DatabaseManager

class caixaDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getcaixa(self,):
        query =""
        return self.db.execute_select_all(query)
    
    def insere_caixa(self,):
        statement = ""
        self.db.execute_statement(statement)
    

    def modifica_caixa(self,):
        statement = ""
        self.db.execute_statement(statement)
        print(statement)