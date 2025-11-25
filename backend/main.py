from flask import Flask, jsonify
from flask_cors import CORS
from rotas.clientes import clientes_blueprint
from rotas.funcionarios import funcionarios_blueprint
from rotas.fornecedores import fornecedores_blueprint
from rotas.produtos import produtos_blueprint
from rotas.caixa import caixa_blueprint
from rotas.authService import auth_blueprint

app = Flask(__name__)
app.secret_key = "chaveextremamentesecretanowaymuitosecreto:O"
CORS(app, origins="*")

@app.route("/", methods=["GET"])
def get_server(): 
    return jsonify("Servidor existe"), 200
app.register_blueprint(clientes_blueprint)
app.register_blueprint(funcionarios_blueprint)
app.register_blueprint(fornecedores_blueprint)
app.register_blueprint(produtos_blueprint)
app.register_blueprint(auth_blueprint)
app.register_blueprint(caixa_blueprint)
app.run("0.0.0.0", port=8000, debug=False)





# from flask import Flask, jsonify
# from flask_cors import CORS
# from rotas.livros import livros_blueprint
# from rotas.impressao import impressao_blueprint
# from rotas.grafica import grafica_blueprint

# app = Flask(__name__)

# CORS(app, origins="*")

# @app.route("/", methods=["GET"])
# def get_autor():
#     return jsonify("It's alive"), 200

# app.register_blueprint(livros_blueprint)
# app.register_blueprint(impressao_blueprint)
# app.register_blueprint(grafica_blueprint)

# app.run("0.0.0.0", port=8000, debug=False)
