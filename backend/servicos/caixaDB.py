from decimal import Decimal
import psycopg2
from servicos.database.conector import DatabaseManager
from psycopg2.errors import ForeignKeyViolation

class caixaDB():
    dicionario_caixa = {} 
    preco_total = Decimal(0)

    def __init__(self, db=None):
        self.db = db if db else DatabaseManager()
        
    def insere_caixa(self, codigo):
        codigo = str(codigo)
        
        if codigo in caixaDB.dicionario_caixa:
            self.atualiza_quantidade(codigo, "aumentar")
            return "Produto adicionado ao caixa"

        query = f"SELECT Codigo, Nome, Preco, Estoque FROM Produto WHERE Codigo = {codigo}"
        produto = self.db.execute_select_one(query)

        if not produto:
            return {"erro": "Produto não cadastrado"}
        
        if int(produto["estoque"]) <= 0:
             return {"erro": "Produto sem estoque"}

        nome = produto["nome"]
        preco = Decimal(produto["preco"])
        
        caixaDB.dicionario_caixa[codigo] = [nome, preco, 1]
        self.recalcula_total()
        
        return "Produto adicionado ao caixa"

    def remove_produto(self, codigo):
        codigo = str(codigo)
        if codigo not in caixaDB.dicionario_caixa:
            return None
        
        item = caixaDB.dicionario_caixa.pop(codigo)
        self.recalcula_total()
        return item 

    def atualiza_quantidade(self, codigo, acao):
        codigo = str(codigo)
        if codigo not in caixaDB.dicionario_caixa:
            return None
        
        if acao == "aumentar":
            caixaDB.dicionario_caixa[codigo][2] += 1
        elif acao == "diminuir":
            if caixaDB.dicionario_caixa[codigo][2] > 1:
                caixaDB.dicionario_caixa[codigo][2] -= 1
        else:
            return {"mensagem": "Acao inválida"}
        
        self.recalcula_total()
        return caixaDB.dicionario_caixa[codigo]

    def limpa_lista(self):
        caixaDB.dicionario_caixa.clear()
        caixaDB.preco_total = Decimal(0)
        return {"mensagem": "Caixa limpo"}

    def get_caixa(self):
        lista_FIFO_caixa = [] 
        for codigo, produto in self.dicionario_caixa.items():
            item_formatado = {
                "codigo": codigo,
                "nome" : produto[0],
                "preco_unitario" : produto[1],
                "quantidade" : produto[2],
                "subtotal" : produto[1] * produto[2]
            }
            lista_FIFO_caixa.append(item_formatado)
        
        return {
            "Total": str(caixaDB.preco_total),
            "Produtos": lista_FIFO_caixa
        }

    def recalcula_total(self):
        total = Decimal(0)
        for key, val in caixaDB.dicionario_caixa.items():
            total += (val[1] * val[2])
        caixaDB.preco_total = total

    def confirmar_venda(self, forma_pagamento:str, cargo:str, cpf_cliente, cpf_funcionario:str):
        if not caixaDB.dicionario_caixa:
            return {"erro" : "O caixa está vazio"}
        
        con = self.db.conn
        cursor = con.cursor()

        try:
            cpf_cliente_val = f"'{cpf_cliente}'" if cpf_cliente else "NULL"

            query_vendas = f"""
                INSERT INTO Compra_Cliente (Valor_Total, Forma_Pagamento, Data_Hora, CPF_Cliente, CPF_Funcionario) 
                VALUES ({float(caixaDB.preco_total)}, '{forma_pagamento}', CURRENT_TIMESTAMP, {cpf_cliente_val}, '{cpf_funcionario}')
                RETURNING NF
            """
            
            cursor.execute(query_vendas)
            nf_gerada = cursor.fetchone()[0]

            for codigo_prod, produto in caixaDB.dicionario_caixa.items():
                qtd_produto = produto[2]
                
                query_produtos = f"""
                    UPDATE Produto 
                    SET Estoque = GREATEST(0, Estoque - {qtd_produto}) 
                    WHERE Codigo = {codigo_prod}
                """
                cursor.execute(query_produtos)
                
                query_abarca = f"""
                    INSERT INTO Abarca (NF_Compra_Cliente, Codigo_Produto, Quantidade)
                    VALUES ({nf_gerada}, {codigo_prod}, {qtd_produto})
                """
                cursor.execute(query_abarca)

            con.commit()

            self.limpa_lista()
            return {"mensagem": "Venda confirmada!", "nf": nf_gerada}
        
        except ForeignKeyViolation:
            con.rollback()
            return {"erro": "CPF do cliente não encontrado no sistema!"}
            
        except Exception as e:
            con.rollback()
            print(f"Erro Crítico: {e}")
            return {"erro": "Falha ao processar venda. Nada foi cobrado."}