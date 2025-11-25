from flask import Blueprint, request, jsonify
from servicos.fluxoDB import fluxoDB

fluxo_blueprint = Blueprint("fluxo", __name__)

@fluxo_blueprint.route("/fluxo", methods=["GET"])
def listar_fluxo():
    nf = request.args.get("nf")
    valor_min = request.args.get("valor_min")
    valor_max = request.args.get("valor_max")
    data_min = request.args.get("min")
    data_max = request.args.get("max")

    resultado = fluxoDB().buscar_fluxo(nf, valor_min, valor_max, data_min, data_max)
    
    return jsonify(resultado), 200

@fluxo_blueprint.route("/fluxo/detalhes/<int:nf>", methods=["GET"])
def detalhes_transacao(nf):
    tipo = request.args.get("tipo")
    
    if not tipo:
        return jsonify({"erro": "Tipo de transação (E/S) obrigatório"}), 400

    detalhes = fluxoDB().get_detalhes_transacao(nf, tipo)
    
    if not detalhes:
        return jsonify({"erro": "Transação não encontrada"}), 404
    
    return jsonify(detalhes), 200