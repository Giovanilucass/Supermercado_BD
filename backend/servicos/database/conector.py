from typing import Any
import psycopg2
from psycopg2.extras import DictCursor


class DatabaseManager:
    def __init__(self) -> None:
        self.conn = psycopg2.connect(
            dbname="Supermercado",
            user="postgres",
            password="12345",
            host="127.0.0.1",
            port=5432,
        )
        self.cursor = self.conn.cursor(cursor_factory=DictCursor)

    
    def execute_statement(self, statement: str) -> bool:
        "Usado para Inserções, Deleções, Alter Tables"
        try:
            self.cursor.execute(statement)
            self.conn.commit()
        except:
            self.conn.reset()
            return False
        return True

    #mudei para aceitar a consulta de produto mais vendido por um determinado período 
    def execute_select_all(self, query: str, params) -> list[dict[str, Any]]:
        "Usado para SELECTS no geral"
        self.cursor.execute(query, params or ())
        return [dict(item) for item in self.cursor.fetchall()]

    def execute_select_one(self, query: str) -> dict | None:
        "Usado para SELECT com apenas uma linha de resposta"
        self.cursor.execute(query)
        query_result = self.cursor.fetchone()

        if not query_result:
            return None

        return dict(query_result)
    