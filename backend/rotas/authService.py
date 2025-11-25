from flask import Blueprint, request, jsonify, session
from servicos.authServiceDB import authServiceDB

auth_blueprint = Blueprint("auth", __name__)

@auth_blueprint.route("/login", methods=["POST"])
def login():
    session.clear()
    data = request.get_json()
    cpf_funcionario = data.get("cpf_funcionario")
    funcionario = authServiceDB().login(cpf_funcionario)
    if not funcionario:
        return jsonify({"erro": "Funcionário não encontrado"}), 404
    
    session["cpf"] = funcionario["cpf"]
    session["nome"] = funcionario["nome"]
    session["cargo"] = funcionario["cargo"]
    
    return jsonify({"mensagem": f"Bem-vindo, {funcionario['nome']}!"}), 200

    

@auth_blueprint.route("/logout", methods=["POST"])
def logout():
    session.clear() # Limpa os dados
    return jsonify({"mensagem": "Logout realizado"}), 200