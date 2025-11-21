from servicos.database.conector import DatabaseManager

class clientesDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getclientes(self, nome: str, cpf: str, data_nascimento: str): #Se não achar nome deixa a string vazia
        query = """
                SELECT * FROM Cliente               
                """
        if nome:
            query += f"WHERE nome = '{nome}'"

        if cpf:
            if "WHERE" in query:
                query+=f"AND cpf = '{cpf}'"
            else:
                query +=f"WHERE cpf = '{cpf}'"

        if data_nascimento:
            if "WHERE" in query:
                query+=f"AND cpf = '{data_nascimento}'"
            else:
                query +=f"WHERE cpf = '{data_nascimento}'"


        return self.db.execute_select_all(query)

        