from flask import Blueprint, jsonify, request
from servicos.produtosDB import produtosDB

produtos_blueprint = Blueprint("produtos", __name__)

@produtos_blueprint.route("/produtos", methods=["GET"])
def get_produtos():
    nome = request.args.get("nome", "")
    codigo = request.args.get("codigo", "")
    categoria = request.args.get("categoria", "")
    return jsonify(produtosDB().getprodutos(codigo, nome, categoria)), 200

@produtos_blueprint.route("/produtos", methods=["POST"])
def post_fornecedores():
    json = request.get_json()
    codigo = json.get("codigo")
    nome = json.get("nome")
    categoria = json.get("categoria")
    produtosDB().insere_produtos(codigo, nome, categoria) #FrontEND escolhe escolherá função a ser chamada e seus parametros
    return jsonify("Terminou o post"), 200