from flask import Blueprint, request, jsonify
from servicos.funcionariosDB import funcionariosDB

funcionarios_blueprint = Blueprint("funcionarios", __name__)

# --- LISTAGEM (Com filtros da imagem) ---
@funcionarios_blueprint.route("/funcionarios", methods=["GET"])
def listar_funcionarios():
    # Filtros vindos da URL
    nome = request.args.get("nome")
    cpf = request.args.get("cpf")
    turno = request.args.get("turno")
    cargo = request.args.get("cargo")
    cpf_supervisor = request.args.get("supervisor")
    
    data_min = request.args.get("min") # DD/MM/YYYY
    data_max = request.args.get("max") # DD/MM/YYYY
    
    # "padrao", "vendas", "salario"
    ordenacao = request.args.get("ordenacao", "padrao") 

    service = funcionariosDB()
    resultados = service.buscar_funcionarios(nome, cpf, turno, cargo, cpf_supervisor, data_min, data_max, ordenacao)
    
    return jsonify(resultados), 200

# --- OBTER UM (Para o modal de edição) ---
@funcionarios_blueprint.route("/funcionarios/consultar", methods=["GET"])
def obter_funcionario():
    cpf = request.args.get("cpf")
    if not cpf:
        return jsonify({"erro": "CPF obrigatório"}), 400

    service = funcionariosDB()
    func = service.get_funcionario_por_cpf(cpf)
    
    if not func:
        return jsonify({"erro": "Funcionário não encontrado"}), 404
    
    return jsonify(func), 200

# --- CRIAR ---
@funcionarios_blueprint.route("/funcionarios", methods=["POST"])
def criar_funcionario():
    data = request.get_json()
    
    # Validação
    if not data.get("cpf") or not data.get("nome") or not data.get("salario"):
        return jsonify({"erro": "Campos obrigatórios faltando"}), 400

    service = funcionariosDB()
    resultado = service.criar_funcionario(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 201

# --- ATUALIZAR ---
@funcionarios_blueprint.route("/funcionarios", methods=["PUT"])
def atualizar_funcionario():
    data = request.get_json()
    cpf_alvo = data.get("cpf") # O CPF original vem aqui
    
    if not cpf_alvo:
        return jsonify({"erro": "CPF obrigatório"}), 400

    service = funcionariosDB()
    resultado = service.atualizar_funcionario(cpf_alvo, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200

# --- DELETAR ---
@funcionarios_blueprint.route("/funcionarios", methods=["DELETE"])
def deletar_funcionario():
    data = request.get_json()
    cpf = data.get("cpf")
    
    if not cpf:
        return jsonify({"erro": "CPF obrigatório"}), 400

    service = funcionariosDB()
    resultado = service.deletar_funcionario(cpf)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200