// scripts/caixa.js

document.addEventListener('DOMContentLoaded', () => {

    const cartListEl = document.getElementById('cart-list');
    if (!cartListEl) return;

    // Referências
    const { products, clients, formatMoney, showToast, saveClients } = window.App;
    
    let cart = [];
    let linkedClient = null;

    // --- Funções do Carrinho ---
    const renderCart = () => {
        cartListEl.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qtd;
            total += itemTotal;
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <div class="cart-col-name">${item.name}</div>
                <div class="cart-col-price">R$ ${formatMoney(item.price)}</div>
                <div class="cart-col-qtd">x ${item.qtd < 10 ? '0'+item.qtd : item.qtd}</div>
                <div class="cart-col-total">R$ ${formatMoney(itemTotal)}</div>
                <div class="cart-col-actions"><button class="btn-remove-item" onclick="window.removeCartItem(${index})"><i class="fas fa-times"></i></button></div>
            `;
            cartListEl.appendChild(row);
        });
        document.getElementById('cart-total-display').innerText = formatMoney(total);
    };

    window.removeCartItem = (index) => { 
        cart.splice(index, 1); 
        renderCart(); 
    };

    document.getElementById('btn-add-item').addEventListener('click', () => {
        const code = document.getElementById('input-prod-code').value.trim();
        const qtd = parseInt(document.getElementById('input-prod-qtd').value);
        if(!code) return;
        
        const p = products.find(x => x.code.replace(/\s/g,'') === code.replace(/\s/g,''));
        if(p) {
            const price = p.price * (1 - (p.promo/100));
            const exist = cart.find(i => i.id === p.id);
            if(exist) exist.qtd += qtd;
            else cart.push({ id: p.id, name: p.name, price: price, qtd: qtd });
            renderCart(); 
            document.getElementById('input-prod-code').value = '';
        } else { 
            showToast('Código incorreto', 'error'); 
        }
    });

    document.getElementById('btn-finish-sale').addEventListener('click', () => {
        if(cart.length === 0) { showToast('Carrinho vazio!', 'error'); return; }
        document.getElementById('overlay-payment').classList.remove('hidden');
    });

    document.getElementById('btn-close-payment').addEventListener('click', () => {
        cart = []; 
        linkedClient = null; // Reseta cliente
        renderCart(); 
        
        // Reseta sidebar
        document.getElementById('client-linked-view').classList.add('hidden');
        document.getElementById('client-search-view').classList.remove('hidden');
        document.getElementById('overlay-payment').classList.add('hidden');
    });

    // --- Gestão de Clientes ---
    const btnGoRegister = document.getElementById('btn-go-register-client');
    const viewSearch = document.getElementById('client-search-view');
    const viewLinked = document.getElementById('client-linked-view');
    const viewRegister = document.getElementById('client-register-view');
    const inputCpfClient = document.getElementById('input-client-cpf');
    const btnSearchClient = document.getElementById('btn-search-client');
    const formClientReg = document.getElementById('form-client-register');
    const btnUnlink = document.getElementById('btn-unlink-client');
    const unlinkOverlay = document.getElementById('overlay-unlink');

    if(btnGoRegister) {
        btnGoRegister.addEventListener('click', () => {
            viewSearch.classList.add('hidden');
            viewRegister.classList.remove('hidden');
        });
    }
    
    document.getElementById('btn-cancel-client-reg')?.addEventListener('click', () => {
        viewRegister.classList.add('hidden');
        viewSearch.classList.remove('hidden');
    });

    const handleSearchClient = () => {
        const cpf = inputCpfClient.value.trim();
        if (!cpf) return;
        const client = clients.find(c => c.cpf === cpf);
        if (client) {
            linkedClient = client;
            document.getElementById('linked-name').innerText = client.name;
            document.getElementById('linked-cpf').innerText = client.cpf;
            viewSearch.classList.add('hidden');
            viewLinked.classList.remove('hidden');
            showToast(`Cliente ${client.name} vinculado!`);
            inputCpfClient.value = '';
        } else {
            if(confirm('CPF não encontrado. Cadastrar novo?')) {
                document.getElementById('reg-cli-cpf').value = cpf;
                viewSearch.classList.add('hidden');
                viewRegister.classList.remove('hidden');
            }
        }
    };
    if(btnSearchClient) btnSearchClient.addEventListener('click', handleSearchClient);

    if(formClientReg) {
        formClientReg.addEventListener('submit', (e) => {
            e.preventDefault();
            const newCpf = document.getElementById('reg-cli-cpf').value;
            const newName = document.getElementById('reg-cli-name').value;
            
            if (newCpf && newName) {
                // CORREÇÃO: Adicionando ID aqui para evitar o bug na página de Clientes
                const newClient = { 
                    id: Date.now(), 
                    cpf: newCpf, 
                    name: newName 
                };
                clients.push(newClient);
                saveClients(); // Salva Globalmente
                
                linkedClient = newClient;
                document.getElementById('linked-name').innerText = newName;
                document.getElementById('linked-cpf').innerText = newCpf;
                viewRegister.classList.add('hidden');
                viewLinked.classList.remove('hidden');
                showToast('Cliente cadastrado e vinculado!');
                formClientReg.reset();
            } else {
                showToast('Preencha os dados obrigatórios', 'error');
            }
        });
    }

    if(btnUnlink) btnUnlink.addEventListener('click', () => unlinkOverlay.classList.remove('hidden'));
    document.getElementById('btn-cancel-unlink').addEventListener('click', () => unlinkOverlay.classList.add('hidden'));
    document.getElementById('btn-confirm-unlink').addEventListener('click', () => {
        linkedClient = null;
        viewLinked.classList.add('hidden');
        viewSearch.classList.remove('hidden');
        unlinkOverlay.classList.add('hidden');
        showToast('Cliente desvinculado.');
    });
});