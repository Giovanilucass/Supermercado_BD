import psycopg2
from psycopg2.errors import ForeignKeyViolation, UniqueViolation
from servicos.database.conector import DatabaseManager

class FornecedoresDB:
    def __init__(self):
        self.db = DatabaseManager()

    def buscar_fornecedores(self, nome=None, cnpj=None, email=None):
        """
        Busca fornecedores com filtros opcionais de nome, cnpj e email.
        """
        sql = """
        SELECT CNPJ, Nome, Email 
        FROM fornecedor
        WHERE 1=1
        """
        parametros = []

        if nome:
            sql += " AND Nome ILIKE %s"
            parametros.append(f"%{nome}%")
        
        if cnpj:
            # Remove pontuação se vier formatado, opcional, mas recomendável
            # cnpj_limpo = cnpj.replace('.', '').replace('/', '').replace('-', '')
            sql += " AND CNPJ LIKE %s"
            parametros.append(f"%{cnpj}%")
        
        if email:
            sql += " AND Email ILIKE %s"
            parametros.append(f"%{email}%")
        
        sql += " ORDER BY Nome ASC"

        con = self.db.conn
        cursor = con.cursor()
        cursor.execute(sql, tuple(parametros))
        
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, lin)) for lin in cursor.fetchall()]
    
    def listar_produtos_do_fornecedor(self, cnpj_fornecedor):
        """
        Retorna a lista de produtos associados a um CNPJ específico.
        Realiza um JOIN entre Produto e Fornece.
        """
        sql = """
            SELECT 
                p.Codigo, 
                p.Nome, 
                p.Preco, 
                p.Estoque, 
                p.Categoria,
                p.Ativo
            FROM Produto p
            INNER JOIN Fornece f ON p.Codigo = f.Codigo_Produto
            WHERE f.CNPJ_Fornecedor = %s
            ORDER BY p.Nome ASC
        """
        
        con = self.db.conn
        cursor = con.cursor()
        
        try:
            cursor.execute(sql, (cnpj_fornecedor,))
            
            # Mapeia o resultado para dicionários
            colunas = [desc[0] for desc in cursor.description]
            produtos = [dict(zip(colunas, lin)) for lin in cursor.fetchall()]
            
            # Opcional: Converter Decimal para float para evitar erros de JSON no frontend
            for prod in produtos:
                if prod.get('preco'):
                    prod['preco'] = float(prod['preco'])
                    
            return produtos

        except Exception as e:
            return {"erro": f"Erro ao buscar produtos do fornecedor: {str(e)}"}

    def criar_fornecedor(self, dados):
        """
        Insere um novo fornecedor. Espera um dicionário com 'cnpj', 'nome' e 'email'.
        """
        cnpj = dados.get("cnpj")
        nome = dados.get("nome")
        email = dados.get("email")

        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute(
                "INSERT INTO Fornecedor (CNPJ, Nome, Email) VALUES (%s, %s, %s)",
                (cnpj, nome, email)
            )
            con.commit()
            return {"mensagem": "Fornecedor cadastrado com sucesso!"}

        except UniqueViolation:
            con.rollback()
            return {"erro": "CNPJ já cadastrado!"}
            
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar fornecedor: {str(e)}"}

    def deletar_fornecedor(self, cnpj):
        """
        Remove um fornecedor pelo CNPJ (Chave Primária).
        """
        con = self.db.conn
        cursor = con.cursor()

        try:
            cursor.execute("DELETE FROM Fornecedor WHERE CNPJ = %s", (cnpj,))
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Fornecedor não encontrado."}
                
            return {"mensagem": "Fornecedor removido com sucesso."}

        except ForeignKeyViolation:
            # Caso o fornecedor esteja atrelado a produtos ou compras
            con.rollback()
            return {"erro": "Não é possível excluir este fornecedor pois ele possui registros vinculados (ex: produtos ou pedidos)."}

        except Exception as e:
            con.rollback()
            return {"erro": f"Erro técnico ao deletar: {str(e)}"}

    # Opcional: Método útil para preencher formulários de edição
    def get_fornecedor_por_cnpj(self, cnpj):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute(
            "SELECT CNPJ, Nome, Email FROM Fornecedor WHERE CNPJ = %s", 
            (cnpj,)
        )
        resultado = cursor.fetchone()
        
        if not resultado:
            return None

        return {
            "cnpj": resultado[0],
            "nome": resultado[1],
            "email": resultado[2]
        }






























# from servicos.database.conector import DatabaseManager

# class fornecedoresDB():
#     def __init__(self, db_provider= DatabaseManager()) -> None:
#         self.db = db_provider
    
#     def getfornecedores(self, cnpj, nome, email):
#         query ="SELECT * FROM fornecedor"
#         return self.db.execute_select_all(query)
    
#     def insere_fornecedores(self, cnpj, nome, email):
#         statement = ""
#         self.db.execute_statement(statement)
    

#     def modifica_forenecedores(self, cnpj, nome, email):
#         statement = ""
#         self.db.execute_statement(statement)
#         print(statement)