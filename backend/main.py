# backend/main.py

from flask import Flask, jsonify
from flask_cors import CORS
from rotas.clientes import clientes_blueprint
from rotas.funcionarios import funcionarios_blueprint
from rotas.fornecedores import fornecedores_blueprint
from rotas.produtos import produtos_blueprint
from rotas.caixa import caixa_blueprint
from rotas.authService import auth_blueprint
from rotas.fluxo import fluxo_blueprint

app = Flask(__name__)
app.secret_key = "chaveextremamentesecretanowaymuitosecreto:O"

# --- CORREÇÃO AQUI ---
# Adicione o IP que você está usando para acessar o site na lista 'origins'.
# Se você mudar de IP (sair do Radmin VPN, por exemplo), terá que adicionar o novo aqui.
CORS(app, supports_credentials=True, origins=[
    "http://127.0.0.1:8080", 
    "http://localhost:8080",
    "http://26.32.237.149:8080"  # <--- SEU IP ATUAL AQUI
])

@app.route("/", methods=["GET"])
def get_server(): 
    return jsonify("Servidor existe"), 200

app.register_blueprint(clientes_blueprint)
app.register_blueprint(funcionarios_blueprint)
app.register_blueprint(fornecedores_blueprint)
app.register_blueprint(produtos_blueprint)
app.register_blueprint(auth_blueprint)
app.register_blueprint(caixa_blueprint)
app.register_blueprint(fluxo_blueprint)

if __name__ == "__main__":
    # O host="0.0.0.0" é essencial para permitir conexões externas (pelo IP)
    app.run(host="0.0.0.0", port=8000, debug=True)