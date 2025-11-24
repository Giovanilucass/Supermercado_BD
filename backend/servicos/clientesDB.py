from servicos.database.conector import DatabaseManager

class clientesDB():
    def __init__(self, db_provider= DatabaseManager()) -> None:
        self.db = db_provider
    
    def getclientes(self, nome: str, cpf: str, data_nascimento_min: str, data_nascimento_max: str): #Se não achar nome deixa a string vazia
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


        # Tratando filtro de data de nascimento
        if data_nascimento_max or data_nascimento_min:
            if "WHERE" in query:
                query+=f"AND "
            else:
                query +=f"WHERE "
            
            if data_nascimento_min and data_nascimento_max:
                query+=f"Data_nascimento BETWEEN '{data_nascimento_min}' AND '{data_nascimento_max}'"
            elif data_nascimento_min:
                query+=f"Data_nascimento > '{data_nascimento_min}'"           
            else:
                  query+=f"Data_nascimento < '{data_nascimento_max}'"
        
        #print(query)
        #print(data_nascimento_min)
        #print(data_nascimento_max)


        return self.db.execute_select_all(query)
    
    #FALTA ATUALIZAR COM O TELEFONE
    def insere_cliente(self, cpf, nome, data_nascimento,telefone, tipo_telefone):
        statement1 = f"INSERT INTO Cliente (cpf, nome, data_nascimento) VALUES ('{cpf}', '{nome}', '{data_nascimento}')"
        statement2 = f"INSERT INTO telefone_cliente (cpf, numero, tipo) VALUES ('{cpf}', '{telefone}', '{tipo_telefone}')"
        self.db.execute_statement(statement1)
        self.db.execute_statement(statement2)
        #print(cpf)
        #print(nome)
        #print(data_nascimento)
        #print(statement)
        #print("INSERIU")

    def modifica_cliente(self, cpf, nome, data_nascimento,telefone, tipo_telefone):
        statement1= f"UPDATE Cliente SET nome = '{nome}', data_nascimento = '{data_nascimento}' WHERE cpf = '{cpf}'"
        statement2= f"UPDATE telefone_cliente SET numero = '{telefone}', tipo = '{tipo_telefone}' WHERE cpf = '{cpf}'"
        self.db.execute_statement(statement1)
        self.db.execute_statement(statement2)
        print(statement1)
        print(statement2)

        