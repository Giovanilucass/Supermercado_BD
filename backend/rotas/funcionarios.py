from flask import Blueprint, jsonify, request
from servicos.funcionariosDB import funcionariosDB

funcionarios_blueprint = Blueprint("funcionarios", __name__)

@funcionarios_blueprint.route("/funcionarios", methods=["GET"])
def get_funcionarios():
    nome = request.args.get("nome", "") # o "" depois faz com que o Python entenda que é uma string
    cpf_funcionario = request.args.get("cpf_funcionario", "")
    cpf_supervisor = request.args.get("cpf_supervisor", "")
    data_nascimento = request.args.get("data_nascimento", "") #O que está dentro do get é como o frontend ve a variavel
    cargo = request.args.get("cargo", "")
    turno = request.args.get("turno", "")
    salario = request.args.get("salario", "")

    return jsonify(funcionariosDB().getfuncionario(nome, cpf_funcionario, cpf_supervisor, data_nascimento, cargo, turno, salario)), 200

@funcionarios_blueprint.route("/funcionarios", methods=["POST"])
def post_funcionarios():
    print("entrou no post")
    json = request.get_json()
    cpf_funcionario = json.get("cpf_funcionario")
    cpf_supervisor = json.get("cpf_supervisor")
    nome = json.get("nome")
    cargo = json.get("cargo")
    turno = json.get("turno")
    salario = json.get("salario")

    data_nascimento = json.get("data_nascimento")
    funcionariosDB().insere_funcionario(nome, cpf_funcionario, cpf_supervisor, data_nascimento, cargo, turno, salario) #FrontEND escolhe escolherá função a ser chamada e seus parametros
    print("Terminou o post")
    return jsonify("Terminou o post"), 200