import psycopg2
from psycopg2.errors import ForeignKeyViolation
from servicos.database.conector import DatabaseManager
from datetime import datetime

class clientesDB:
    def __init__(self):
        self.db = DatabaseManager()

    def converter_data(self, data_str):
        if not data_str: return None
        try:
            return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            return None 

    def buscar_clientes(self, nome=None, cpf=None, data_min=None, data_max=None):
        sql = """
            SELECT cpf, nome, to_char(data_nascimento, 'DD/MM/YYYY') as data_nascimento
            FROM Cliente
            WHERE 1=1
        """
        parametros = []

        if nome:
            sql += " AND nome ILIKE %s"
            parametros.append(f"%{nome}%")
        if cpf:
            sql += " AND cpf LIKE %s"
            parametros.append(f"%{cpf}%")
        if data_min:
            dt = self.converter_data(data_min)
            if dt:
                sql += " AND data_nascimento >= %s"
                parametros.append(dt)
        if data_max:
            dt = self.converter_data(data_max)
            if dt:
                sql += " AND data_nascimento <= %s"
                parametros.append(dt)
        
        sql += " ORDER BY nome ASC"

        con = self.db.conn
        cursor = con.cursor()
        cursor.execute(sql, tuple(parametros))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, lin)) for lin in cursor.fetchall()]

    def get_cliente_por_cpf(self, cpf:str):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute(
            "SELECT cpf, nome, to_char(data_nascimento, 'YYYY-MM-DD') FROM Cliente WHERE cpf = %s", 
            (cpf,)
        )
        cliente = cursor.fetchone()
        if not cliente: 
            return None

        # Busca telefones (mudamos o nome da coluna para cpf_cliente)
        cursor.execute(
            "SELECT numero, tipo FROM Telefone_Cliente WHERE cpf_cliente = %s", 
            (cpf,)
        )
        telefones = [{"numero": row[0], "tipo": row[1]} for row in cursor.fetchall()]

        return {
            "cpf": cliente[0],
            "nome": cliente[1],
            "data_nascimento": cliente[2],
            "telefones": telefones
        }


    def criar_cliente(self, dados):
        cpf = dados.get("cpf")
        nome = dados.get("nome")
        data_nasc = self.converter_data(dados.get("data_nascimento"))
        telefones = dados.get("telefones", []) 

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "INSERT INTO Cliente (cpf, nome, data_nascimento) VALUES (%s, %s, %s)",
                (cpf, nome, data_nasc)
            )

            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO Telefone_Cliente (cpf_cliente, numero, tipo) VALUES (%s, %s, %s)",
                        (cpf, tel.get("numero"), tel.get("tipo"))
                    )

            con.commit()
            return {"mensagem": "Cliente cadastrado!"}
        except psycopg2.errors.UniqueViolation:
            con.rollback()
            return {"erro": "CPF já cadastrado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar: {str(e)}"}

    def atualizar_cliente(self, cpf, dados):
        nome = dados.get("nome")
        data_nasc = dados.get("data_nascimento")
        if "/" in str(data_nasc):
            data_nasc = self.converter_data(data_nasc)
        
        telefones = dados.get("telefones", [])

        con = self.db.conn
        cursor = con.cursor()

        try:
            # Atualiza dados básicos
            cursor.execute(
                "UPDATE Cliente SET nome = %s, data_nascimento = %s WHERE cpf = %s",
                (nome, data_nasc, cpf)
            )

            cursor.execute("DELETE FROM Telefone_Cliente WHERE cpf_cliente = %s", (cpf))

            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO Telefone_Cliente (cpf_cliente, numero, tipo) VALUES (%s, %s, %s)",
                        (cpf, tel.get("numero"), tel.get("tipo"))
                    )

            con.commit()
            return {"mensagem": "Atualizado com sucesso!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao atualizar: {str(e)}"}

    def deletar_cliente(self, cpf):
        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute("DELETE FROM Cliente WHERE cpf = %s", (cpf,))
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Cliente não encontrado."}
                
            return {"mensagem": "Cliente removido."}

        except ForeignKeyViolation: # O Postgres envia esse erro específico
            con.rollback()
            return {"erro": "Não é possível excluir este cliente pois ele possui histórico de compras registrada."}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro técnico: {str(e)}"}