from flask import Blueprint, request, jsonify
from servicos.fornecedoresDB import fornecedoresDB

fornecedores_blueprint = Blueprint("fornecedores", __name__)

# --- LISTAGEM ---
@fornecedores_blueprint.route("/fornecedores", methods=["GET"])
def listar_fornecedores():
    nome = request.args.get("nome")
    cnpj = request.args.get("cnpj")

    service = fornecedoresDB()
    resultados = service.buscar_fornecedores(nome, cnpj)
    
    return jsonify(resultados), 200

# --- OBTER UM (Para Modal de Edição) ---
@fornecedores_blueprint.route("/fornecedores/consultar", methods=["GET"])
def obter_fornecedor():
    cnpj = request.args.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    service = fornecedoresDB()
    forn = service.get_fornecedor_por_cnpj(cnpj)
    
    if not forn:
        return jsonify({"erro": "Fornecedor não encontrado"}), 404
    
    return jsonify(forn), 200

# --- OBTER PRODUTOS (Para Modal "Olho") ---
@fornecedores_blueprint.route("/fornecedores/produtos", methods=["GET"])
def listar_produtos_fornecedor():
    cnpj = request.args.get("cnpj")
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    service = fornecedoresDB()
    produtos = service.get_produtos_do_fornecedor(cnpj)
    
    return jsonify(produtos), 200

# --- CRIAR ---
@fornecedores_blueprint.route("/fornecedores", methods=["POST"])
def criar_fornecedor():
    data = request.get_json()
    
    if not data.get("cnpj") or not data.get("nome"):
        return jsonify({"erro": "CNPJ e Nome são obrigatórios"}), 400

    service = fornecedoresDB()
    resultado = service.criar_fornecedor(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 201

# --- ATUALIZAR ---
@fornecedores_blueprint.route("/fornecedores", methods=["PUT"])
def atualizar_fornecedor():
    data = request.get_json()
    cnpj_alvo = data.get("cnpj")
    
    if not cnpj_alvo:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    service = fornecedoresDB()
    resultado = service.atualizar_fornecedor(cnpj_alvo, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200

# --- DELETAR ---
@fornecedores_blueprint.route("/fornecedores", methods=["DELETE"])
def deletar_fornecedor():
    data = request.get_json()
    cnpj = data.get("cnpj")
    
    if not cnpj:
        return jsonify({"erro": "CNPJ obrigatório"}), 400

    service = fornecedoresDB()
    resultado = service.deletar_fornecedor(cnpj)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200