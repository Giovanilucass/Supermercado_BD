from flask import Blueprint, request, jsonify
from servicos.fornecedoresDB import fornecedoresDB

fornecedores_blueprint = Blueprint("fornecedores", __name__)

@fornecedores_blueprint.route("/fornecedores", methods=["GET"])
def listar_fornecedores():
    nome = request.args.get("nome")
    cnpj = request.args.get("cnpj")

    resultados = fornecedoresDB().buscar_fornecedores(nome, cnpj)
    
    return jsonify(resultados), 200


@fornecedores_blueprint.route("/fornecedores/consultar", methods=["GET"])
def obter_fornecedor():
    cnpj = request.args.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    forn = fornecedoresDB().get_fornecedor_por_cnpj(cnpj)
    
    if not forn:
        return jsonify({"erro": "Fornecedor não encontrado"}), 404
    
    return jsonify(forn), 200


@fornecedores_blueprint.route("/fornecedores/produtos", methods=["GET"])
def listar_produtos_fornecedor():
    cnpj = request.args.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    produtos = fornecedoresDB().get_produtos_do_fornecedor(cnpj)
    
    return jsonify(produtos), 200


@fornecedores_blueprint.route("/fornecedores", methods=["POST"])
def criar_fornecedor():
    data = request.get_json()
    
    if not data.get("cnpj") or not data.get("nome"):
        return jsonify({"erro": "CNPJ e Nome são obrigatórios"}), 400

    resultado = fornecedoresDB().criar_fornecedor(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 201


@fornecedores_blueprint.route("/fornecedores", methods=["PUT"])
def atualizar_fornecedor():
    data = request.get_json()
    cnpj_alvo = data.get("cnpj")
    
    if not cnpj_alvo:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    resultado = fornecedoresDB().atualizar_fornecedor(cnpj_alvo, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200


@fornecedores_blueprint.route("/fornecedores", methods=["DELETE"])
def deletar_fornecedor():
    data = request.get_json()
    cnpj = data.get("cnpj")
    
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    resultado = fornecedoresDB().deletar_fornecedor(cnpj)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200