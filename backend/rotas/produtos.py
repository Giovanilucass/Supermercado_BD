from flask import Blueprint, request, jsonify
from servicos.produtosDB import produtosDB

produtos_blueprint = Blueprint("produtos", __name__)

@produtos_blueprint.route("/produtos", methods=["GET"])
def listar_produtos():
    nome = request.args.get("nome")
    codigo = request.args.get("codigo")
    categoria = request.args.get("categoria")

    promocao = request.args.get("promocao") 
    acabando = request.args.get("acabando")
    
    ordenacao = request.args.get("ordenacao", "padrao")

    resultados = produtosDB().buscar_produtos(nome, codigo, categoria, promocao, acabando, ordenacao)
    
    return jsonify(resultados), 200

@produtos_blueprint.route("/produtos/<int:codigo>", methods=["GET"])
def obter_produto(codigo):
    prod = produtosDB().get_produto_por_codigo(codigo)
    
    if not prod:
        return jsonify({"erro": "Produto não encontrado"}), 404
    
    return jsonify(prod), 200

@produtos_blueprint.route("/produtos", methods=["POST"])
def criar_produto():
    data = request.get_json()
    
    # Validação simples
    if not data.get("nome") or not data.get("preco") or not data.get("categoria"):
        return jsonify({"erro": "Nome, Preço e Categoria são obrigatórios"}), 400

    resultado = produtosDB().criar_produto(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 201

@produtos_blueprint.route("/produtos/<int:codigo>", methods=["PUT"])
def atualizar_produto(codigo):
    data = request.get_json()
    
    resultado = produtosDB().atualizar_produto(codigo, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200

@produtos_blueprint.route("/produtos/<int:codigo>", methods=["DELETE"])
def deletar_produto(codigo):
    resultado = produtosDB().deletar_produto(codigo)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200