from flask import Blueprint, request, jsonify
from servicos.fluxoDB import fluxoDB

fluxo_blueprint = Blueprint("fluxo", __name__)

# --- LISTAGEM DO FLUXO ---
@fluxo_blueprint.route("/fluxo", methods=["GET"])
def listar_fluxo():
    nf = request.args.get("nf")
    valor_min = request.args.get("valor_min")
    valor_max = request.args.get("valor_max")
    data_min = request.args.get("min")
    data_max = request.args.get("max")

    service = fluxoDB()
    resultado = service.buscar_fluxo(nf, valor_min, valor_max, data_min, data_max)
    
    return jsonify(resultado), 200

# --- DETALHES DA TRANSAÇÃO ---
# O front precisa passar a NF e o TIPO ('E' ou 'S') para sabermos onde buscar
@fluxo_blueprint.route("/fluxo/detalhes/<int:nf>", methods=["GET"])
def detalhes_transacao(nf):
    tipo = request.args.get("tipo") # 'E' ou 'S'
    
    if not tipo:
        return jsonify({"erro": "Tipo de transação (E/S) obrigatório"}), 400

    service = fluxoDB()
    detalhes = service.get_detalhes_transacao(nf, tipo)
    
    if not detalhes:
        return jsonify({"erro": "Transação não encontrada"}), 404
    
    return jsonify(detalhes), 200