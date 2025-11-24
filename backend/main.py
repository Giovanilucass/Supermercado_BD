from flask import Flask
from flask_cors import CORS
from rotas.produtosEstoque import produtosEstoque_blueprint

app = Flask(__name__)
CORS(app, origins="*")
app.register_blueprint(produtosEstoque_blueprint)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

