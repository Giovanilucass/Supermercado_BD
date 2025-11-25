from flask import Blueprint, request, jsonify
from servicos.produtosDB import produtosDB

produtos_blueprint = Blueprint("produtos", __name__)

# --- LISTAGEM (Filtros da Imagem 4) ---
@produtos_blueprint.route("/produtos", methods=["GET"])
def listar_produtos():
    # Filtros da URL
    nome = request.args.get("nome")
    codigo = request.args.get("codigo")
    categoria = request.args.get("categoria")
    
    # Filtros Toggle (Vêm como string "true" ou "false" do JS)
    promocao = request.args.get("promocao") 
    acabando = request.args.get("acabando")
    
    # Ordenação: "padrao", "mais_vendidos", "menor_preco", "maior_preco"
    ordenacao = request.args.get("ordenacao", "padrao")

    service = produtosDB()
    resultados = service.buscar_produtos(nome, codigo, categoria, promocao, acabando, ordenacao)
    
    return jsonify(resultados), 200

# --- OBTER UM (Para o Modal de Edição) ---
@produtos_blueprint.route("/produtos/<int:codigo>", methods=["GET"])
def obter_produto(codigo):
    service = produtosDB()
    prod = service.get_produto_por_codigo(codigo)
    
    if not prod:
        return jsonify({"erro": "Produto não encontrado"}), 404
    
    return jsonify(prod), 200

# --- CRIAR (Botão Registrar Novo Produto) ---
@produtos_blueprint.route("/produtos", methods=["POST"])
def criar_produto():
    data = request.get_json()
    
    # Validação simples
    if not data.get("nome") or not data.get("preco") or not data.get("categoria"):
        return jsonify({"erro": "Nome, Preço e Categoria são obrigatórios"}), 400

    service = produtosDB()
    resultado = service.criar_produto(data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
    
    return jsonify(resultado), 201

# --- ATUALIZAR (Botão Confirmar Edição) ---
@produtos_blueprint.route("/produtos/<int:codigo>", methods=["PUT"])
def atualizar_produto(codigo):
    data = request.get_json()
    
    service = produtosDB()
    resultado = service.atualizar_produto(codigo, data)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200

# --- DELETAR (Botão Deletar Produto) ---
@produtos_blueprint.route("/produtos/<int:codigo>", methods=["DELETE"])
def deletar_produto(codigo):
    service = produtosDB()
    resultado = service.deletar_produto(codigo)
    
    if "erro" in resultado:
        return jsonify(resultado), 400
        
    return jsonify(resultado), 200