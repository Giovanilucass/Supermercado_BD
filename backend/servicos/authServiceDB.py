from servicos.database.conector import DatabaseManager

class authServiceDB():
    def __init__(self):
        self.db = DatabaseManager()

    def login(self, cpf_funcionario):
        # Limpa espaços em branco que possam vir do frontend
        cpf_limpo = cpf_funcionario.strip()
        
        print(f"\n🔍 Tentando login para CPF: '{cpf_limpo}'")

        # Consulta explícita no schema SUPERMERCADO
        query = f"""
            SELECT nome, cargo
            FROM SUPERMERCADO.Funcionario
            WHERE CPF = '{cpf_limpo}'
        """
        
        try:
            funcionario = self.db.execute_select_one(query)
            
            if not funcionario:
                print("⚠️  Nenhum funcionário encontrado com este CPF.")
                # Debug: Listar todos os CPFs que existem para você conferir
                check = self.db.execute_select_all("SELECT CPF FROM SUPERMERCADO.Funcionario")
                print(f"📋 CPFs existentes no banco: {[f['cpf'] for f in check]}")
                return None
            
            print(f"✅ Sucesso! Usuário encontrado: {funcionario['nome']}")
            
            dicionario_limpo = {
                "cpf" : cpf_limpo,
                "nome" : funcionario["nome"],
                "cargo" : funcionario["cargo"]
            }
        
            return dicionario_limpo
            
        except Exception as e:
            print(f"❌ Erro na consulta de login: {e}")
            return None