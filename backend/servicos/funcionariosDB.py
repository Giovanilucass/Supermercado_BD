from servicos.database.conector import DatabaseManager

class funcionariosDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getfuncionario(self, nome, cpf_funcionario, cpf_supervisor, data_nascimento, cargo, turno, salario):
        query ="SELECT * FROM funcionario"
        return self.db.execute_select_all(query)
    
    def insere_funcionario(self, cpf, nome, data_nascimento):
        statement = ""
        print(cpf)
        print(nome)
        print(data_nascimento)
        print(statement)
        self.db.execute_statement(statement)
        print("INSERIU")

    def modifica_funcionario(self, nome, cpf_funcionario, cpf_supervisor, data_nascimento, cargo, turno, salario):
        statement= ""
        self.db.execute_statement(statement)
        print(statement)