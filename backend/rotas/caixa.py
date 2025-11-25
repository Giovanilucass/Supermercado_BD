from flask import Blueprint, jsonify, request, session
from servicos.caixaDB import caixaDB

caixa_blueprint = Blueprint("caixa", __name__)

@caixa_blueprint.route("/caixa", methods=["GET"])
def get_caixa():
    return jsonify(caixaDB().get_caixa()), 200

@caixa_blueprint.route("/caixa", methods=["POST"])
def insere_caixa():
    data = request.get_json()
    codigo = str(data.get("codigo"))
    if codigo == "0":
        return jsonify({"mensagem" : "O produto 0 não é válido!"})
    feedback = caixaDB().insere_caixa(codigo)
    return jsonify(feedback), 201 

@caixa_blueprint.route("/caixa", methods=["DELETE"])
def limpa_lista():
    return jsonify(caixaDB().limpa_lista()), 200

@caixa_blueprint.route("/caixa/<codigo>", methods=["DELETE"])
def remove_produto(codigo):
    resultado = caixaDB().remove_produto(codigo)
    if resultado is None:
        return jsonify({"erro": "Produto não encontrado no caixa"}), 404
    return jsonify({"mensagem": "Produto removido", "item": resultado}), 200

@caixa_blueprint.route("/caixa/<codigo>", methods=["PATCH"])
def atualiza_quantidade(codigo):
    data = request.get_json()
    acao = data.get("acao") 
    resultado = caixaDB().atualiza_quantidade(codigo, acao)
    if resultado is None:
        return jsonify({"erro": "Produto não encontrado no caixa para atualizar"}), 404
    return jsonify(resultado), 200

@caixa_blueprint.route("/caixa/confirmar", methods=["POST"])
def confirmar_venda():
    if "cpf" not in session:
        return jsonify({"erro": "Você precisa fazer login!"}), 401
    
    data = request.get_json()
    forma_de_pagamento = data.get("forma_de_pagamento")
    cpf_cliente = data.get("cpf_cliente")

    usuario_cpf = session["cpf"]
    usuario_cargo = session["cargo"]
    
    resultado = caixaDB().confirmar_venda(forma_de_pagamento, usuario_cargo, cpf_cliente, usuario_cpf)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200