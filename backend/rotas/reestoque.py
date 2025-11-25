from flask import Blueprint, request, jsonify
from servicos.reestoqueDB import reestoqueDB

reestoque_blueprint = Blueprint("reestoque", __name__)

@reestoque_blueprint.route("/reestoque", methods=["GET"])
def listar_entradas():
    busca = request.args.get("busca") # Barra de pesquisa
    
    data_min = request.args.get("data_min")
    data_max = request.args.get("data_max")
    valor_min = request.args.get("valor_min")
    valor_max = request.args.get("valor_max")

    resultados = reestoqueDB().buscar_entradas(busca, data_min, data_max, valor_min, valor_max)
    
    return jsonify(resultados), 200

@reestoque_blueprint.route("/reestoque", methods=["POST"])
def criar_entrada():
    data = request.get_json()
    
    # Validações básicas
    if not data.get("cnpj_fornecedor") or not data.get("codigo_produto"):
        return jsonify({"erro": "Fornecedor e Produto são obrigatórios"}), 400

    resultado = reestoqueDB().criar_entrada(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 201

@reestoque_blueprint.route("/reestoque/<int:nf>", methods=["PUT"])
def atualizar_entrada(nf):
    data = request.get_json()
    resultado = reestoqueDB().atualizar_entrada(nf, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 200

@reestoque_blueprint.route("/reestoque/<int:nf>", methods=["DELETE"])
def deletar_entrada(nf):
    resultado = reestoqueDB().deletar_entrada(nf)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 200