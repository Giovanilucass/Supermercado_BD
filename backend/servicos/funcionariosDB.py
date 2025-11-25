import psycopg2
from datetime import datetime
from servicos.database.conector import DatabaseManager

class funcionariosDB:
    def __init__(self):
        self.db = DatabaseManager()

    def converter_data(self, data_str):
        """Converte DD/MM/YYYY para YYYY-MM-DD"""
        if not data_str: return None
        try:
            return datetime.strptime(data_str, "%d/%m/%Y").strftime("%Y-%m-%d")
        except ValueError:
            return None 

    def limpar_moeda(self, valor_str):
        """Converte 'R$ 1.400,50' para 1400.50"""
        if not valor_str: return 0.00
        if isinstance(valor_str, (int, float)): return valor_str
        
        # Remove R$, espaços e pontos de milhar
        limpo = valor_str.replace("R$", "").replace(" ", "").replace(".", "")
        # Troca a vírgula decimal por ponto
        limpo = limpo.replace(",", ".")
        try:
            return float(limpo)
        except:
            return 0.00

    # --- LISTAGEM COM FILTROS E ORDENAÇÃO (TELA 1) ---
    def buscar_funcionarios(self, nome=None, cpf=None, turno=None, cargo=None, cpf_supervisor=None, data_min=None, data_max=None, ordenacao="padrao"):
        con = self.db.conn
        cursor = con.cursor()

        # Base da Query
        # Se a ordenação for por vendas, precisamos fazer um LEFT JOIN
        if ordenacao == "vendas":
            sql = """
                SELECT f.CPF, f.Nome, f.Turno, f.Salario, 
                       to_char(f.Data_Nascimento, 'DD/MM/YYYY') as data_nascimento, 
                       f.Cargo, f.CPF_Supervisor,
                       COUNT(v.NF) as total_vendas
                FROM Funcionario f
                LEFT JOIN Compra_Cliente v ON f.CPF = v.CPF_Funcionario
                WHERE 1=1
            """
        else:
            sql = """
                SELECT CPF, Nome, Turno, Salario, 
                       to_char(Data_Nascimento, 'DD/MM/YYYY') as data_nascimento, 
                       Cargo, CPF_Supervisor
                FROM Funcionario
                WHERE 1=1
            """
        
        params = []

        # --- FILTROS DINÂMICOS ---
        if nome:
            sql += " AND f.Nome ILIKE %s" if ordenacao == "vendas" else " AND Nome ILIKE %s"
            params.append(f"%{nome}%")
        
        if cpf:
            sql += " AND f.CPF LIKE %s" if ordenacao == "vendas" else " AND CPF LIKE %s"
            params.append(f"%{cpf}%")

        if turno and turno != "Todos":
            sql += " AND f.Turno = %s" if ordenacao == "vendas" else " AND Turno = %s"
            params.append(turno)

        if cargo and cargo != "Todos":
            sql += " AND f.Cargo = %s" if ordenacao == "vendas" else " AND Cargo = %s"
            params.append(cargo)

        if cpf_supervisor:
            sql += " AND f.CPF_Supervisor LIKE %s" if ordenacao == "vendas" else " AND CPF_Supervisor LIKE %s"
            params.append(f"%{cpf_supervisor}%")

        if data_min:
            dt = self.converter_data(data_min)
            if dt:
                sql += " AND f.Data_Nascimento >= %s" if ordenacao == "vendas" else " AND Data_Nascimento >= %s"
                params.append(dt)
        
        if data_max:
            dt = self.converter_data(data_max)
            if dt:
                sql += " AND f.Data_Nascimento <= %s" if ordenacao == "vendas" else " AND Data_Nascimento <= %s"
                params.append(dt)

        # --- ORDENAÇÃO ---
        if ordenacao == "vendas":
            sql += " GROUP BY f.CPF ORDER BY total_vendas DESC"
        elif ordenacao == "salario":
            sql += " ORDER BY Salario DESC"
        else:
            sql += " ORDER BY Nome ASC" # Padrão

        cursor.execute(sql, tuple(params))
        colunas = [desc[0] for desc in cursor.description]
        return [dict(zip(colunas, row)) for row in cursor.fetchall()]

    # --- BUSCA INDIVIDUAL ---
    def get_funcionario_por_cpf(self, cpf):
        con = self.db.conn
        cursor = con.cursor()
        
        cursor.execute(
            "SELECT CPF, Nome, Turno, Salario, to_char(Data_Nascimento, 'YYYY-MM-DD') as data_nascimento, Cargo, CPF_Supervisor FROM Funcionario WHERE CPF = %s", 
            (cpf,)
        )
        res = cursor.fetchone()
        if not res: return None
        
        colunas = [desc[0] for desc in cursor.description]
        return dict(zip(colunas, res))

    # --- CRIAR FUNCIONÁRIO ---
    def criar_funcionario(self, dados):
        cpf = dados.get("cpf")
        nome = dados.get("nome")
        turno = dados.get("turno")
        cargo = dados.get("cargo")
        # Conversões
        salario = self.limpar_moeda(dados.get("salario"))
        data_nasc = self.converter_data(dados.get("data_nascimento"))
        
        # Supervisor: Se vier vazio, manda NULL (None) pro banco
        cpf_supervisor = dados.get("cpf_supervisor")
        if not cpf_supervisor or cpf_supervisor.strip() == "":
            cpf_supervisor_val = "NULL"
        else:
            cpf_supervisor_val = f"'{cpf_supervisor}'"

        con = self.db.conn
        cursor = con.cursor()

        try:
            # Usando f-string conforme solicitado para INSERT
            query = f"""
                INSERT INTO Funcionario (CPF, Nome, Turno, Salario, Data_Nascimento, Cargo, CPF_Supervisor)
                VALUES ('{cpf}', '{nome}', '{turno}', {salario}, '{data_nasc}', '{cargo}', {cpf_supervisor_val})
            """
            cursor.execute(query)
            con.commit()
            return {"mensagem": "Funcionário cadastrado com sucesso!"}

        except psycopg2.errors.UniqueViolation:
            con.rollback()
            return {"erro": "CPF já cadastrado!"}
        except psycopg2.errors.ForeignKeyViolation:
            con.rollback()
            return {"erro": "CPF do Supervisor não encontrado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao criar: {str(e)}"}

    # --- ATUALIZAR FUNCIONÁRIO ---
    def atualizar_funcionario(self, cpf_original, dados):
        nome = dados.get("nome")
        turno = dados.get("turno")
        cargo = dados.get("cargo")
        
        # Conversões
        salario = self.limpar_moeda(dados.get("salario"))
        
        data_nasc = dados.get("data_nascimento")
        if "/" in str(data_nasc):
            data_nasc = self.converter_data(data_nasc)

        cpf_supervisor = dados.get("cpf_supervisor")
        if not cpf_supervisor or cpf_supervisor.strip() == "":
            cpf_supervisor_val = "NULL"
        else:
            cpf_supervisor_val = f"'{cpf_supervisor}'"

        con = self.db.conn
        cursor = con.cursor()

        try:
            query = f"""
                UPDATE Funcionario 
                SET Nome = '{nome}', 
                    Turno = '{turno}', 
                    Salario = {salario}, 
                    Data_Nascimento = '{data_nasc}', 
                    Cargo = '{cargo}', 
                    CPF_Supervisor = {cpf_supervisor_val}
                WHERE CPF = '{cpf_original}'
            """
            cursor.execute(query)
            con.commit()
            return {"mensagem": "Funcionário atualizado!"}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro ao atualizar: {str(e)}"}

    # --- DELETAR FUNCIONÁRIO ---
    def deletar_funcionario(self, cpf):
        con = self.db.conn
        cursor = con.cursor()

        try:
            # Graças ao 'ON DELETE SET NULL' na tabela Funcionario (Supervisor) e Compra_Cliente,
            # podemos deletar sem medo de quebrar referências (elas viram NULL).
            cursor.execute(f"DELETE FROM Funcionario WHERE CPF = '{cpf}'")
            con.commit()
            
            if cursor.rowcount == 0:
                return {"erro": "Funcionário não encontrado."}

            return {"mensagem": "Funcionário removido."}
        except Exception as e:
            con.rollback()
            return {"erro": f"Erro técnico ao deletar: {str(e)}"}