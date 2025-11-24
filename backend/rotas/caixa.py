from flask import Blueprint, jsonify, request
from servicos.caixaDB import caixaDB

caixa_blueprint = Blueprint("caixa", __name__)

@caixa_blueprint.route("/caixa", methods=["GET"])
def get_caixa():
    codigo = request.args.get("codigo", "")
    nome = request.args.get("nome", "")
    categoria = request.args.get("categoria", "")
    return jsonify(caixaDB().getcaixa(codigo, nome, categoria)), 200

@caixa_blueprint.route("/caixa", methods=["POST"])
def post_caixa():
    json = request.get_json()
    codigo = json.get("codigo")
    nome = json.get("nome")
    categoria = json.get("categoria")
    caixaDB().insere_caixa(codigo, nome, categoria) #FrontEND escolhe escolherá função a ser chamada e seus parametros
    return jsonify("Terminou o post"), 200