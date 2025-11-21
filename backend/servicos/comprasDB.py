from servicos.database.conector import DatabaseManager

class comprasDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getclientes(self):
        query = """
                SELECT * FROM cliente



                """
        return self.db.execute_select_all(query)
