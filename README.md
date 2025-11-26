# Supermercado

### Informações sobre os integrantes do grupo
Bruno Tenorio Park

Carolina Numata Pereira

Lucas Giovani Santos Ross

Tiago Silveira Almeida

Vinicius Chirnev Panhoca

### Como utilizar/iniciar o sistema
Para utilizar o Banco de Dados é necessário seguir os seguintes passos:
1. Baixar os arquivos do repositório Supermercado_BD na branch main.
2. Executar o script.txt no pgAdmin4, ou outra ferramenta de Banco de Dados em SQL,
certificar-se que o nome do BD é Supermercado e a senha e usuário são postgres
(Se optar por outra opção alterar no arquivo backend\conector.py).
3. Instalar a versão mais recente do python.
4. Rodar o comando a seguir em um terminal (isso irá instalar os requerimentos para o
servidor Flask do backend):
pip install -r backend/requirements.txt
5. Rodar o comando a seguir na pasta na qual se encontra o código principal (Deve ser
algo como Supermercado_BD-final, ele irá abrir o servidor Flask)
python backend/main.py
6. E então iremos iniciar o frontend, precisamos hospedar o http localmente, para isso
baixe a versão mais recente do Node.js (ou alguma outra forma de hospedar sites
localmente)
7. E execute o seguinte comando em um terminal (ele irá baixar os requerimentos para
abrir o servidor local):
npm install -g http-server
8. Por fim execute o seguinte código no diretório frontend (ou onde estiverem os
códigos html, provavelmente Supermercado_BD-final\frontend, ele irá iniciar o
servidor http):
http-server -p 8080
9. Assim teremos o site hospedado no localhost no URL que aparece no terminal,
provavelmente http://127.0.0.1:8080, abrindo esse URL no navegador o BD estará
disponível para utilização.

### Breve descrição do minimundo (domínio) escolhido
O nosso minimundo é um Supermercado Atacadista, com funcionários, gerentes, produtos e infraestrutura para exposição dos produtos (prateleiras, geladeiras, freezers, etc.), além de relações de entrada e saída financeira.

A partir disso, o banco de dados que será construído deverá auxiliar na gerência do supermercado a armazenar e analisar dados sobre os produtos em estoque, as vendas, as compras, os funcionários contratados e além dos clientes e fornecedores cadastrados.

### Requisitos funcionais do sistema:

● Gerenciar produtos (preço, quantidade, validade, nome, fornecedor, Lote (ID),
promoções);

● Alertar produtos com final de validade próxima, fim de estoque, produtos populares;

● Gerenciar estoque, a partir dos critérios: tipo e quantidade dos produtos (perto de
acabar ou em abundância);

● Gerenciar fluxo de venda (entrada), a partir dos critérios: ID venda, produtos
vendidos (tipos, quantidades e lotes), valor de entrada, data e hora (timestamp);

● Gerenciar funcionários (acessos ao sistema, horários de trabalho, cargos, dados
pessoais);

● Gerenciar fornecedores (CNPJ, formas de contato, produtos fornecidos e preço);

● Gerenciar clientes fidelizados (dados relativos ao nome, formas de contato, CPF e
data de nascimento) para terem acesso aos descontos e promoções do
supermercado;

● Gerenciar compras a fornecedores (saída), a partir dos critérios: ID compra,
produtos comprados (tipos, quantidades e lotes), valor de saída, data e hora
(timestamp)

Repositório criado como um projeto de banco de dados para um Supermercado Atacadista por os alunos do segundo semestre de 2025 de Banco de Dados 1.

## Diagrama Entidade-Relacionamento
![Diagrama_Entidade-Relacionamento.png](https://github.com/Giovanilucass/Supermercado_BD/blob/main/Diagrama%20Entidade-Relacionamento.png)

## Tabela de Relacionamentos
![Tabela_de_Relacionamentos.png](https://github.com/Giovanilucass/Supermercado_BD/blob/main/Tabela%20de%20Relacionamentos.png)


