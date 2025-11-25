from flask import Blueprint, jsonify, request
from servicos.fornecedoresDB import fornecedoresDB

fornecedores_blueprint = Blueprint("fornecedores", __name__)

@fornecedores_blueprint.route("/fornecedores", methods=["GET"])
def get_fornecedores():
    nome = request.args.get("nome", "")
    cnpj = request.args.get("cnpj", "")
    email = request.args.get("email", "")
    return jsonify(fornecedoresDB().getfornecedores(cnpj, nome, email)), 200

@fornecedores_blueprint.route("/fornecedores", methods=["POST"])
def post_fornecedores():
    json = request.get_json()
    cnpj = json.get("cnpj")
    email = json.get("email")
    fornecedoresDB().insere_fornecedores(cnpj, nome, email) #FrontEND escolhe escolherá função a ser chamada e seus parametros
    return jsonify("Terminou o post"), 200