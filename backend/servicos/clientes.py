from flask import Blueprint, request, jsonify
from servicos.clientesDB import clientesDB

clientes_blueprint = Blueprint("clientes", __name__)

@clientes_blueprint.route("/clientes", methods=["GET"])
def listar_clientes():
    # Captura os parâmetros da URL (ex: /clientes?nome=maria&cpf=123)
    nome = request.args.get("nome")
    cpf = request.args.get("cpf")
    data_min = request.args.get("min") # Espera DD/MM/YYYY do front
    data_max = request.args.get("max")

    resultados = clientesDB().buscar_clientes(nome, cpf, data_min, data_max)
    
    return jsonify(resultados), 200


@clientes_blueprint.route("/clientes/<cpf>", methods=["GET"])
def obter_cliente(cpf): #Aqui é pra usar no caixa
    cliente = clientesDB().get_cliente_por_cpf(cpf)
    
    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404
    
    return jsonify(cliente), 200


@clientes_blueprint.route("/clientes", methods=["POST"])
def criar_cliente():
    data = request.get_json()
    
    # Validação mínima
    if not data.get("cpf") or not data.get("nome"):
        return jsonify({"erro": "Campos CPF e Nome são obrigatórios"}), 400

    resultado = clientesDB().criar_cliente(data)
    
    if "erro" in resultado:
        # Retorna 400 ou 409 se for CPF duplicado
        status = 409 if "cadastrado" in resultado["erro"] else 400
        return jsonify(resultado), status
    
    return jsonify(resultado), 201 # 201 Created


@clientes_blueprint.route("/clientes/<cpf>", methods=["PUT"])
def atualizar_cliente(cpf):
    data = request.get_json()
    
    resultado = clientesDB().atualizar_cliente(cpf, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200


@clientes_blueprint.route("/clientes", methods=["DELETE"])
def deletar_cliente():
    # Agora pegamos o CPF de dentro do JSON, igual no cadastro
    data = request.get_json()
    cpf_para_deletar = data.get("cpf")
    
    if not cpf_para_deletar:
        return jsonify({"erro": "CPF é obrigatório no corpo da requisição"}), 400
    # Passamos o CPF formatado (sujo) direto pro serviço
    resultado = clientesDB().deletar_cliente(cpf_para_deletar)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200