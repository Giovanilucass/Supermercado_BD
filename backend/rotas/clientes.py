from flask import Blueprint, jsonify, request
from servicos.clientesDB import clientesDB

clientes_blueprint = Blueprint("clientes", __name__)

@clientes_blueprint.route("/clientes", methods=["GET"])
def get_clientes():
    nome = request.args.get("nome", "") # o "" depois faz com que o Python entenda que é uma string
    cpf = request.args.get("cpf", "")
    data_nascimento = request.args.get("data_nascimento", "")
    return jsonify(clientesDB().getclientes(nome, cpf, data_nascimento)), 200