import psycopg2
from servicos.database.conector import DatabaseManager

class fornecedoresDB:
    def __init__(self):
        self.db = DatabaseManager()

    def _limpar_cnpj(self, cnpj):
        """Remove pontos, traços e barras"""
        if not cnpj: return ""
        return str(cnpj).replace(".", "").replace("-", "").replace("/", "")

    def buscar_fornecedores(self, nome=None, cnpj=None):
        con = self.db.conn
        cursor = con.cursor()

        sql = """
            SELECT CNPJ, Nome, Email
            FROM Fornecedor
            WHERE 1=1
        """
        params = []

        if nome:
            sql += " AND Nome ILIKE %s"
            params.append(f"%{nome}%")
        
        if cnpj:
            sql += " AND CNPJ LIKE %s"
            params.append(f"%{cnpj}%")

        sql += " ORDER BY Nome ASC"

        cursor.execute(sql, tuple(params))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    def get_fornecedor_por_cnpj(self, cnpj):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute("SELECT CNPJ, Nome, Email FROM Fornecedor WHERE CNPJ = %s", (cnpj,))
        fornecedor = cursor.fetchone()
        if not fornecedor: return None

        cursor.execute("SELECT Numero, tipo FROM TELEFONE_Fornecedor WHERE CNPJ = %s", (cnpj,))
        telefones = [{"numero": row[0], "tipo": row[1]} for row in cursor.fetchall()]

        return {
            "cnpj": fornecedor[0],
            "nome": fornecedor[1],
            "email": fornecedor[2],
            "telefones": telefones
        }

    def get_produtos_do_fornecedor(self, cnpj):
        con = self.db.conn
        cursor = con.cursor()
        
        sql = """
            SELECT p.Codigo, p.Nome
            FROM Produto p
            JOIN Fornece f ON p.Codigo = f.Codigo_Produto
            WHERE f.CNPJ_Fornecedor = %s
            ORDER BY p.Nome ASC
        """
        cursor.execute(sql, (cnpj,))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    def criar_fornecedor(self, dados):
        cnpj = dados.get("cnpj")
        nome = dados.get("nome")
        email = dados.get("email")
        telefones = dados.get("telefones", []) 

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "INSERT INTO Fornecedor (CNPJ, Nome, Email) VALUES (%s, %s, %s)",
                (cnpj, nome, email)
            )

            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO TELEFONE_Fornecedor (CNPJ, Numero, tipo) VALUES (%s, %s, %s)",
                        (cnpj, tel.get("numero"), tel.get("tipo"))
                    )

            con.commit()
            return {"mensagem": "Fornecedor cadastrado!"}

        except psycopg2.errors.UniqueViolation:
            con.rollback()
            return {"erro": "CNPJ já cadastrado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar: {str(e)}"}

    def atualizar_fornecedor(self, cnpj_original, dados):
        nome = dados.get("nome")
        email = dados.get("email")
        telefones = dados.get("telefones", [])

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "UPDATE Fornecedor SET Nome = %s, Email = %s WHERE CNPJ = %s",
                (nome, email, cnpj_original)
            )

            cursor.execute("DELETE FROM TELEFONE_Fornecedor WHERE CNPJ = %s", (cnpj_original,))

            for tel in telefones:
                if tel.get("numero"):
                    cursor.execute(
                        "INSERT INTO TELEFONE_Fornecedor (CNPJ, Numero, tipo) VALUES (%s, %s, %s)",
                        (cnpj_original, tel.get("numero"), tel.get("tipo"))
                    )

            con.commit()
            return {"mensagem": "Atualizado com sucesso!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao atualizar: {str(e)}"}

    def deletar_fornecedor(self, cnpj):
        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute("DELETE FROM Fornecedor WHERE CNPJ = %s", (cnpj,))
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Fornecedor não encontrado."}

            return {"mensagem": "Fornecedor removido."}
            
        except psycopg2.errors.ForeignKeyViolation:
            con.rollback()
            return {"erro": "Não é possível excluir: Fornecedor possui histórico de entregas ou produtos vinculados."}
            
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro técnico: {str(e)}"}