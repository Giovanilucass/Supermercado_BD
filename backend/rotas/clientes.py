from flask import Blueprint, jsonify, request
from servicos.clientesDB import clientesDB

clientes_blueprint = Blueprint("clientes", __name__)

@clientes_blueprint.route("/clientes", methods=["GET"])
def get_clientes():
    nome = request.args.get("nome", "") # o "" depois faz com que o Python entenda que é uma string
    cpf = request.args.get("cpf", "")
    data_nascimento_min = request.args.get("data_nascimento_min", "") #O que está dentro do get é como o frontend ve a variavel
    data_nascimento_max = request.args.get("data_nascimento_max", "")
    return jsonify(clientesDB().getclientes(nome, cpf, data_nascimento_min, data_nascimento_max)), 200

@clientes_blueprint.route("/clientes", methods=["POST"])
def post_clientes():
    print("entrou no post")
    json = request.get_json()
    cpf = json.get("cpf")
    nome = json.get("nome")
    data_nascimento = json.get("data_nascimento")
    telefone = json.get("telefone")
    tipo_telefone = json.get("tipo_telefone")
    clientesDB().modifica_cliente(cpf, nome, data_nascimento, telefone, tipo_telefone) #FrontEND escolhe escolherá função a ser chamada e seus parametros
    print("Terminou o post")
    return jsonify("Terminou o post"), 200