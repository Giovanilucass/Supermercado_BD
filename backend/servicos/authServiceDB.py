from servicos.database.conector import DatabaseManager

class authServiceDB():
    def __init__(self):
        self.db = DatabaseManager()

    def login(self, cpf_funcionario):
        query = f"""
            SELECT nome, cargo
            FROM funcionario
            WHERE cpf = '{cpf_funcionario}'
        """
        funcionario = self.db.execute_select_one(query)
        if not funcionario:
            return None
        
        dicionario_limpo = {
            "cpf" : cpf_funcionario,
            "nome" : funcionario["nome"],
            "cargo" : funcionario["cargo"]
        }
    
        return dicionario_limpo