from flask import Blueprint, request, jsonify
from servicos.fornecedoresDB import FornecedoresDB 

fornecedores_blueprint = Blueprint("fornecedores", __name__)

@fornecedores_blueprint.route("/fornecedores", methods=["GET"])
def listar_fornecedores():
    # Parâmetros de busca opcionais
    nome = request.args.get("nome")
    cnpj = request.args.get("cnpj")
    email = request.args.get("email")

    resultados = FornecedoresDB().buscar_fornecedores(nome, cnpj, email)
    return jsonify(resultados), 200

@fornecedores_blueprint.route("/fornecedores/consultar", methods=["GET"])
def obter_fornecedor(): 
    cnpj = str(request.args.get("cnpj"))
    
    if not cnpj:
        return jsonify({"erro": "CNPJ é obrigatório para consulta"}), 400

    # Usa o método get_fornecedor_por_cnpj que incluí na classe DB
    fornecedor = FornecedoresDB().get_fornecedor_por_cnpj(cnpj)
    
    if not fornecedor:
        return jsonify({"erro": "Fornecedor não encontrado"}), 404
    
    return jsonify(fornecedor), 200

@fornecedores_blueprint.route("/fornecedores/produtos", methods=["GET"])
def listar_produtos_fornecedor():
    """
    Rota nova específica: Lista produtos oferecidos por um fornecedor
    Exemplo de uso: /fornecedores/produtos?cnpj=12345678000199
    """
    cnpj = request.args.get("cnpj")
    
    if not cnpj:
        return jsonify({"erro": "CNPJ é obrigatório para buscar os produtos"}), 400

    resultados = FornecedoresDB().listar_produtos_do_fornecedor(cnpj)
    
    # Verifica se houve erro técnico no retorno
    if isinstance(resultados, dict) and "erro" in resultados:
        return jsonify(resultados), 400
        
    return jsonify(resultados), 200

@fornecedores_blueprint.route("/fornecedores", methods=["POST"])
def criar_fornecedor():
    data = request.get_json()
    
    # Validação simples
    if not data.get("cnpj") or not data.get("nome"):
        return jsonify({"erro": "Campos CNPJ e Nome são obrigatórios"}), 400

    resultado = FornecedoresDB().criar_fornecedor(data)
    
    if "erro" in resultado:
        # 409 Conflict se já existe, 400 Bad Request para outros erros
        status = 409 if "cadastrado" in resultado["erro"] else 400
        return jsonify(resultado), status
    
    return jsonify(resultado), 201

@fornecedores_blueprint.route("/fornecedores", methods=["DELETE"])
def deletar_fornecedor():
    data = request.get_json()
    cnpj_para_deletar = data.get("cnpj")
    
    if not cnpj_para_deletar:
        return jsonify({"erro": "CNPJ é obrigatório no corpo da requisição"}), 400
        
    resultado = FornecedoresDB().deletar_fornecedor(cnpj_para_deletar)
    
    if "erro" in resultado:
        # Retorna erro se o fornecedor tiver produtos vinculados (Foreign Key)
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200
































# from flask import Blueprint, jsonify, request
# from servicos.fornecedoresDB import fornecedoresDB 

# fornecedores_blueprint = Blueprint("fornecedores", __name__)

# @fornecedores_blueprint.route("/fornecedores", methods=["GET"])
# def listar_fornecedores():
#     nome = request.args.get("nome", "")
#     cnpj = request.args.get("cnpj", "")
#     email = request.args.get("email", "")
#     resultado = fornecedoresDB().buscar_fornecedores(cnpj, nome, email)
#     return jsonify(resultado), 200

# @fornecedores_blueprint.route("/fornecedores", methods=["POST"])
# def insere_fornecedores():
#     json = request.get_json()
#     cnpj = json.get("cnpj")
#     email = json.get("email")
#     fornecedoresDB().criar_fornecedor(cnpj, nome, email) #FrontEND escolhe escolherá função a ser chamada e seus parametros
#     return jsonify("Terminou o post"), 200