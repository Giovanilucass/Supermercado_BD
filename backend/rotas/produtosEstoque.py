from datetime import datetime
from flask import Blueprint, jsonify, request
from servicos.database.conector import DatabaseManager
from servicos.produtosEstoque import GestaoProdutosEstoque

produtosEstoque_blueprint = Blueprint("produtos_estoque", __name__)
db = DatabaseManager()
gestao = GestaoProdutosEstoque(db)

@produtosEstoque_blueprint.route("/produtos", methods=["GET"])
def get_produtos():
    categoria = request.args.get("categoria", "")
    try:
        produtos = gestao.get_produtos(categoria)
        return jsonify(produtos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 501



@produtosEstoque_blueprint.route("/estoquebaixo", methods=["GET"])
def get_estoque_baixo():
    estoque = request.args.get('estoque', 100, type =int)
    try:
        produtos = gestao.get_produtos_estoque_baixo(estoque)
        return jsonify(produtos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@produtosEstoque_blueprint.route("/promocao", methods=["GET"])
def get_produtos_promocao():
    try:
        produtos = gestao.get_produtos_promocao()
        return jsonify(produtos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    


@produtosEstoque_blueprint.route("/fornecedor", methods=["GET"])
def get_produtos_por_fornecedor():
    cnpj = request.args.get("cnpj")
    try:
        resultado = gestao.get_produtos_por_fornecedor(cnpj)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@produtosEstoque_blueprint.route("/maisvendido", methods=["GET"])
def get_produto_mais_vendido_periodo():
    data_inicial = request.args.get("Data_Hora_inicial")
    data_final = request.args.get("Data_Hora_final")
    try:
        resultado = gestao.get_produto_mais_vendido(data_inicial, data_final)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
