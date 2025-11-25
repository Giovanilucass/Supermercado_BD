// frontend/scripts/caixa.js

document.addEventListener('DOMContentLoaded', () => {

    const cartListEl = document.getElementById('cart-list');
    if (!cartListEl) return;

    // Importa métodos do shared.js
    const { 
        formatMoney, showToast, 
        getCaixa, adicionarAoCaixa, removerDoCaixa, atualizarQtdCaixa, limparCaixa, confirmarVenda,
        getClientes, criarCliente 
    } = window.App;
    
    // Estado local apenas para o Cliente (o carrinho fica no servidor)
    let linkedClient = null;

    // --- 1. RENDERIZAÇÃO DO CARRINHO (Busca do Servidor) ---
    const renderCart = async () => {
        cartListEl.innerHTML = '<p style="text-align:center; padding:10px;">Atualizando...</p>';
        
        try {
            // Busca o estado atual do caixa no Backend
            const dados = await getCaixa(); 
            // Esperado: { Total: "100.00", Produtos: [ { nome, codigo, preco_unitario, quantidade, subtotal } ] }

            cartListEl.innerHTML = '';
            
            if (!dados.Produtos || dados.Produtos.length === 0) {
                cartListEl.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Carrinho vazio.</p>';
                document.getElementById('cart-total-display').innerText = "0,00";
                return;
            }

            dados.Produtos.forEach((item) => {
                const row = document.createElement('div');
                row.className = 'cart-item-row';
                
                row.innerHTML = `
                    <div class="cart-col-name">
                        ${item.nome} <br/> 
                        <span style="font-size:10px; color:#666;">Cod: ${item.codigo}</span>
                    </div>
                    <div class="cart-col-price">R$ ${formatMoney(item.preco_unitario)}</div>
                    <div class="cart-col-qtd">
                        <div style="display:flex; align-items:center; justify-content:center; gap:5px;">
                            <button class="btn-circle" style="background:#ccc;" onclick="window.changeQtd('${item.codigo}', 'diminuir')">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span style="min-width:20px; text-align:center;">${item.quantidade}</span>
                            <button class="btn-circle" style="background:#333; color:white;" onclick="window.changeQtd('${item.codigo}', 'aumentar')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="cart-col-total">R$ ${formatMoney(item.subtotal)}</div>
                    <div class="cart-col-actions">
                        <button class="btn-remove-item" onclick="window.removeItem('${item.codigo}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                cartListEl.appendChild(row);
            });

            // Atualiza o Total
            document.getElementById('cart-total-display').innerText = formatMoney(dados.Total);

        } catch (error) {
            console.error(error);
            cartListEl.innerHTML = '<p style="color:red; text-align:center;">Erro de conexão com o caixa.</p>';
        }
    };

    // --- 2. AÇÕES DE ITEM (Expostas para o HTML) ---
    
    // Alterar Quantidade (+ / -)
    window.changeQtd = async (codigo, acao) => {
        // acao deve ser "aumentar" ou "diminuir"
        const res = await atualizarQtdCaixa(codigo, acao);
        if (res.ok) {
            renderCart(); // Recarrega a lista atualizada do servidor
        } else {
            showToast("Erro ao atualizar quantidade", "error");
        }
    };

    // Remover Item (X)
    window.removeItem = async (codigo) => {
        const res = await removerDoCaixa(codigo);
        if (res.ok) {
            renderCart();
        } else {
            showToast("Erro ao remover item", "error");
        }
    };

    // --- 3. ADICIONAR PRODUTO ---
    const btnAdd = document.getElementById('btn-add-item');
    const inputCode = document.getElementById('input-prod-code');
    const inputQtd = document.getElementById('input-prod-qtd');

    btnAdd.addEventListener('click', async () => {
        const codigo = inputCode.value.trim();
        const qtd = parseInt(inputQtd.value) || 1;

        if (!codigo) {
            showToast("Digite o código do produto", "error");
            return;
        }

        // O backend adiciona 1 por vez. Vamos fazer um loop simples para suportar o input de quantidade.
        // (Idealmente o backend aceitaria quantidade, mas vamos adaptar o front à regra atual)
        let sucesso = true;
        for (let i = 0; i < qtd; i++) {
            const res = await adicionarAoCaixa(codigo);
            if (!res.ok) {
                const err = await res.json();
                showToast(err.erro || "Erro ao adicionar produto", "error");
                sucesso = false;
                break; // Para se der erro
            }
        }

        if (sucesso) {
            renderCart();
            inputCode.value = '';
            inputQtd.value = 1;
            inputCode.focus();
        }
    });

    // Limpar Carrinho
    document.getElementById('btn-clear-cart').addEventListener('click', async (e) => {
        e.preventDefault();
        if(confirm("Deseja esvaziar o carrinho?")) {
            await limparCaixa();
            renderCart();
        }
    });

    // Inicializa
    renderCart();


    // --- 4. CLIENTE (Busca e Vinculação) ---
    const inputCpfClient = document.getElementById('input-client-cpf');
    const btnSearchClient = document.getElementById('btn-search-client');
    const viewSearch = document.getElementById('client-search-view');
    const viewLinked = document.getElementById('client-linked-view');
    const viewRegister = document.getElementById('client-register-view');
    const formClientReg = document.getElementById('form-client-register');

    // Buscar Cliente
    btnSearchClient.addEventListener('click', async () => {
        const cpf = inputCpfClient.value.trim();
        if (!cpf) return;

        // Usa a rota de listagem filtrada ou consulta direta
        // Como shared.js tem getClientes(filtro), usamos ele.
        const clientes = await getClientes({ cpf: cpf });
        
        // Filtro exato (caso o backend use LIKE e retorne parciais)
        const cliente = clientes.find(c => c.cpf === cpf);

        if (cliente) {
            linkedClient = cliente;
            vincularClienteVisual(cliente);
        } else {
            if(confirm("Cliente não encontrado. Deseja cadastrar?")) {
                document.getElementById('reg-cli-cpf').value = cpf;
                viewSearch.classList.add('hidden');
                viewRegister.classList.remove('hidden');
            }
        }
    });

    function vincularClienteVisual(cliente) {
        document.getElementById('linked-name').innerText = cliente.nome;
        document.getElementById('linked-cpf').innerText = cliente.cpf;
        viewSearch.classList.add('hidden');
        viewLinked.classList.remove('hidden');
        showToast(`Cliente ${cliente.nome} vinculado!`);
        inputCpfClient.value = '';
    }

    // Desvincular
    document.getElementById('btn-unlink-client').addEventListener('click', () => {
        document.getElementById('overlay-unlink').classList.remove('hidden');
    });

    document.getElementById('btn-confirm-unlink').addEventListener('click', () => {
        linkedClient = null;
        viewLinked.classList.add('hidden');
        viewSearch.classList.remove('hidden');
        document.getElementById('overlay-unlink').classList.add('hidden');
        showToast('Cliente desvinculado.');
    });
    
    document.getElementById('btn-cancel-unlink').addEventListener('click', () => {
        document.getElementById('overlay-unlink').classList.add('hidden');
    });

    // Registrar Novo Cliente (Via Caixa)
    if(formClientReg) {
        formClientReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            // Pega dados do form (simplificado para o contexto do caixa)
            const cpf = document.getElementById('reg-cli-cpf').value;
            const nome = document.getElementById('reg-cli-name').value;
            
            // Datas (Backend espera YYYY-MM-DD ou DD/MM/YYYY tratado)
            // O form do caixa tem inputs separados sem IDs específicos no HTML original fornecido, 
            // vou assumir a ordem ou adicionar IDs se necessário. 
            // Baseado no HTML fornecido anteriormente:
            const dateInputs = viewRegister.querySelectorAll('.input-sidebar-date');
            const dd = dateInputs[0]?.value || '01';
            const mm = dateInputs[1]?.value || '01';
            const yyyy = dateInputs[2]?.value || '2000';

            const dados = {
                cpf: cpf,
                nome: nome,
                data_nascimento: `${dd}/${mm}/${yyyy}`,
                telefones: [] // O form simplificado do caixa pode não ter telefones ou precisar adaptar
            };

            const res = await criarCliente(dados);
            if(res.ok) {
                showToast("Cliente cadastrado!");
                linkedClient = { cpf, nome }; // Vincula automaticamente
                vincularClienteVisual(linkedClient);
                viewRegister.classList.add('hidden');
                formClientReg.reset();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao cadastrar cliente");
            }
        });
    }

    document.getElementById('btn-go-register-client').addEventListener('click', () => {
        viewSearch.classList.add('hidden');
        viewRegister.classList.remove('hidden');
    });
    
    document.getElementById('btn-cancel-client-reg').addEventListener('click', () => {
        viewRegister.classList.add('hidden');
        viewSearch.classList.remove('hidden');
    });


    // --- 5. PAGAMENTO E FINALIZAÇÃO ---
    const payOverlay = document.getElementById('overlay-payment');
    const paySelect = document.getElementById('payment-method-select');
    const btnConfirmPay = document.getElementById('btn-confirm-payment');
    const btnCancelPay = document.getElementById('btn-cancel-payment');
    const paySuccessView = document.getElementById('payment-success-view');
    const btnNewSale = document.getElementById('btn-new-sale');

    // Abrir Modal
    document.getElementById('btn-finish-sale').addEventListener('click', async () => {
        // Verifica se tem itens antes de abrir
        const dados = await getCaixa();
        if(!dados.Produtos || dados.Produtos.length === 0) {
            showToast("O carrinho está vazio!", "error");
            return;
        }

        // Reseta visual do modal
        paySelect.classList.remove('hidden');
        paySelect.previousElementSibling.classList.remove('hidden'); // Label
        paySuccessView.classList.add('hidden');
        btnConfirmPay.classList.remove('hidden');
        btnCancelPay.classList.remove('hidden');
        btnNewSale.classList.add('hidden');
        
        payOverlay.classList.remove('hidden');
    });

    // Confirmar Pagamento
    btnConfirmPay.addEventListener('click', async () => {
        const metodo = paySelect.value;
        const cpfCliente = linkedClient ? linkedClient.cpf : null;

        const dadosVenda = {
            forma_de_pagamento: metodo,
            cpf_cliente: cpfCliente
        };

        const res = await confirmarVenda(dadosVenda);

        if (res.ok) {
            const resposta = await res.json();
            // Sucesso Visual
            paySelect.classList.add('hidden');
            paySelect.previousElementSibling.classList.add('hidden');
            btnConfirmPay.classList.add('hidden');
            btnCancelPay.classList.add('hidden');
            
            paySuccessView.classList.remove('hidden');
            btnNewSale.classList.remove('hidden');
            
            showToast(`Venda Realizada! NF: ${resposta.nf || '---'}`);
            
            // Limpa estado local
            linkedClient = null;
            document.getElementById('client-linked-view').classList.add('hidden');
            document.getElementById('client-search-view').classList.remove('hidden');
            
            // O carrinho no servidor já é limpo pelo backend no sucesso da venda
            renderCart(); 

        } else {
            const err = await res.json();
            alert(err.erro || "Erro ao processar venda");
        }
    });

    // Botão "Nova Venda" (após sucesso)
    btnNewSale.addEventListener('click', () => {
        payOverlay.classList.add('hidden');
        renderCart(); // Garante que está vazio visualmente
    });

    // Cancelar Modal
    btnCancelPay.addEventListener('click', () => payOverlay.classList.add('hidden'));
});