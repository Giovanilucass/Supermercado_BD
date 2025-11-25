import psycopg2
from psycopg2.errors import ForeignKeyViolation, UniqueViolation
from servicos.database.conector import DatabaseManager
from datetime import datetime

class clientesDB:
    def __init__(self):
        self.db = DatabaseManager()

    def converter_data_completa(self, data_str):
        if not data_str: return None
        try:
            return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            return None 

    def extrair_ano(self, valor):
        if not valor: return None
        valor = str(valor).strip()
        
        if len(valor) == 4 and valor.isdigit():
            return int(valor)
            
        try:
            return datetime.strptime(valor, "%d/%m/%Y").year
        except:
            return None

    def buscar_clientes(self, nome=None, cpf=None, ano_min=None, ano_max=None):
        sql = """
            SELECT CPF, Nome, to_char(Data_Nascimento, 'DD/MM/YYYY') as data_nascimento
            FROM Cliente
            WHERE 1=1
        """
        params = []

        if nome:
            sql += " AND Nome ILIKE %s"
            params.append(f"%{nome}%")
        
        if cpf:
            sql += " AND CPF LIKE %s"
            params.append(f"%{cpf}%")

        if ano_min:
            ano = self.extrair_ano(ano_min)
            if ano:
                sql += " AND EXTRACT(YEAR FROM Data_Nascimento) >= %s"
                params.append(ano)

        if ano_max:
            ano = self.extrair_ano(ano_max)
            if ano:
                sql += " AND EXTRACT(YEAR FROM Data_Nascimento) <= %s"
                params.append(ano)
        
        sql += " ORDER BY Nome ASC"

        con = self.db.conn
        cursor = con.cursor()
        cursor.execute(sql, tuple(params))
        
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    def get_cliente_por_cpf(self, cpf):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute(
            "SELECT CPF, Nome, to_char(Data_Nascimento, 'YYYY-MM-DD') FROM Cliente WHERE CPF = %s", 
            (cpf,) 
        )
        cliente = cursor.fetchone()
        if not cliente: return None

        cursor.execute(
            "SELECT Numero, tipo FROM TELEFONE_Cliente WHERE cpf_cliente = %s", 
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
        # Aqui usamos a conversão completa, pois ao criar precisamos do dia/mês
        data_nasc = self.converter_data_completa(dados.get("data_nascimento"))
        telefones = dados.get("telefones", []) 

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "INSERT INTO Cliente (CPF, Nome, Data_Nascimento) VALUES (%s, %s, %s)",
                (cpf, nome, data_nasc)
            )

            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO TELEFONE_Cliente (cpf_cliente, Numero, tipo) VALUES (%s, %s, %s)",
                        (cpf, tel.get("numero"), tel.get("tipo"))
                    )

            con.commit()
            return {"mensagem": "Cliente cadastrado!"}

        except UniqueViolation:
            con.rollback()
            return {"erro": "CPF já cadastrado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar: {str(e)}"}

    def atualizar_cliente(self, cpf_original, dados):
        nome = dados.get("nome")
        data_nasc = dados.get("data_nascimento")
        
        if data_nasc and "/" in str(data_nasc):
            data_nasc = self.converter_data_completa(data_nasc)

        telefones = dados.get("telefones", [])

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "UPDATE Cliente SET Nome = %s, Data_Nascimento = %s WHERE CPF = %s",
                (nome, data_nasc, cpf_original)
            )

            cursor.execute("DELETE FROM TELEFONE_Cliente WHERE cpf_cliente = %s", (cpf_original,))

            # Insere novos
            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO TELEFONE_Cliente (cpf_cliente, Numero, tipo) VALUES (%s, %s, %s)",
                        (cpf_original, tel.get("numero"), tel.get("tipo"))
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
            cursor.execute("DELETE FROM Cliente WHERE CPF = %s", (cpf,))
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Cliente não encontrado."}

            return {"mensagem": "Cliente removido."}

        except ForeignKeyViolation:
            con.rollback()
            return {"erro": "Não é possível excluir: Cliente possui histórico de compras."}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro técnico: {str(e)}"}