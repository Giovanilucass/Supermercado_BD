from typing import Any
import psycopg2
from psycopg2.extras import DictCursor

class DatabaseManager:
    def __init__(self) -> None:
        # Configurações do Banco
        self.db_config = {
            "dbname": "Supermercado",   # Geralmente é 'postgres' se você não criou outro
            "user": "postgres",
            "password": "postgres", # <--- VERIFIQUE SUA SENHA AQUI
            "host": "127.0.0.1",
            "port": "5432"
        }

        try:
            # Conecta
            self.conn = psycopg2.connect(
                dbname=self.db_config["dbname"],
                user=self.db_config["user"],
                password=self.db_config["password"],
                host=self.db_config["host"],
                port=self.db_config["port"],
                options="-c client_encoding=utf8" # Força UTF-8 para evitar erros no Windows
            )
            self.cursor = self.conn.cursor(cursor_factory=DictCursor)
            
            # --- O PULO DO GATO ---
            # Força o Postgres a olhar primeiro no schema SUPERMERCADO
            self.cursor.execute("SET search_path TO SUPERMERCADO, public;")
            self.conn.commit()
            
            print(f"✅ Conectado ao banco '{self.db_config['dbname']}' com sucesso!")
            
        except Exception as e:
            print(f"\n❌ ERRO CRÍTICO DE CONEXÃO: {e}")
            print("Verifique se o pgAdmin está aberto e se a senha está correta no arquivo conector.py\n")
            raise e

    def execute_statement(self, statement: str) -> bool:
        try:
            self.cursor.execute(statement)
            self.conn.commit()
            return True
        except Exception as e:
            print(f"❌ Erro SQL (Statement): {e}")
            self.conn.rollback()
            return False

    def execute_select_all(self, query: str) -> list[dict[str, Any]]:
        try:
            self.cursor.execute(query)
            return [dict(item) for item in self.cursor.fetchall()]
        except Exception as e:
            print(f"❌ Erro SQL (Select All): {e}")
            self.conn.rollback()
            return []

    def execute_select_one(self, query: str) -> dict | None:
        try:
            self.cursor.execute(query)
            result = self.cursor.fetchone()
            if not result:
                return None
            return dict(result)
        except Exception as e:
            print(f"❌ Erro SQL (Select One): {e}")
            self.conn.rollback()
            return None