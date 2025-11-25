// frontend/scripts/estoque.js

document.addEventListener('DOMContentLoaded', () => {
    
    const stockList = document.getElementById('stock-list');
    if (!stockList) return;

    const { formatMoney, showToast } = window.App;
    let currentEditId = null; // Armazena o CÓDIGO do produto sendo editado

    // --- RENDERIZAÇÃO ---
    const renderStock = async () => {
        stockList.innerHTML = '<p style="text-align:center; padding:20px;">Carregando estoque...</p>';
        
        // Filtros
        const nameFilter = document.getElementById('search-name')?.value || '';
        const codeFilter = document.getElementById('search-code')?.value || '';
        const catFilter = document.getElementById('filter-category')?.value || '';
        const promoFilter = document.getElementById('filter-promo')?.checked ? "true" : "";
        const endingFilter = document.getElementById('filter-ending')?.checked ? "true" : "";
        const sortType = document.getElementById('sort-products')?.value || 'default';

        // Mapeia ordenação para o padrão do Python
        let sortBackend = 'padrao';
        if (sortType === 'sold-desc') sortBackend = 'mais_vendidos';
        if (sortType === 'price-asc') sortBackend = 'menor_preco';
        if (sortType === 'price-desc') sortBackend = 'maior_preco';

        const filtros = {
            nome: nameFilter,
            codigo: codeFilter,
            categoria: catFilter,
            promocao: promoFilter,
            acabando: endingFilter,
            ordenacao: sortBackend
        };

        try {
            const products = await window.App.getProdutos(filtros);
            
            stockList.innerHTML = '';

            if (!products || products.length === 0) {
                stockList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum produto encontrado.</p>';
                return;
            }

            products.forEach(p => {
                // O backend retorna chaves em minúsculo (ex: p.codigo, p.nome)
                const promoVal = parseFloat(p.promocao || 0);
                const priceVal = parseFloat(p.preco || 0);
                const finalPrice = promoVal > 0 ? priceVal * (1 - (promoVal / 100)) : priceVal;
                
                const item = document.createElement('div');
                item.className = 'stock-item-row';
                
                const soldBadge = p.total_vendido ? `<span style="font-size:10px; color:#666">(${p.total_vendido} vend.)</span>` : '';

                // CORREÇÃO AQUI: Usando p.codigo no onclick
                item.innerHTML = `
                    <div class="stock-field-group code-col">
                        <label>Código</label>
                        <input type="text" value="${p.codigo}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group name-col">
                        <label>Nome ${soldBadge}</label>
                        <input type="text" value="${p.nome}" class="stock-input" readonly>
                    </div>
                    <div class="stock-field-group price-col">
                        <label>Preço ${promoVal > 0 ? '(-' + promoVal + '%)' : ''}</label>
                        <div class="price-input-wrapper">
                            <span>R$</span>
                            <input type="text" value="${formatMoney(finalPrice)}" class="stock-input-transparent" readonly>
                        </div>
                    </div>
                    <div class="stock-field-group cat-col">
                        <label>Categoria</label>
                        <input type="text" value="${p.categoria || '-'}" class="stock-input" readonly>
                    </div>
                    <button class="btn-edit-stock" onclick="window.openEditModal('${p.codigo}')">
                        <i class="fas fa-pen"></i>
                    </button>
                `;
                stockList.appendChild(item);
            });

        } catch (error) {
            console.error(error);
            stockList.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar estoque.</p>';
        }
    };

    // Listeners de Filtro
    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderStock);
    document.querySelectorAll('.filter-input, .filter-select, .switch input').forEach(el => {
        el.addEventListener('change', renderStock);
    });
    
    renderStock(); // Carrega ao abrir

    // --- REGISTRO (CREATE) ---
    const btnOpenReg = document.getElementById('btn-abrir-form-estoque');
    const btnCancelReg = document.getElementById('btn-cancelar-estoque');
    const formReg = document.getElementById('form-register');
    const viewDef = document.getElementById('stock-default-view');
    const viewForm = document.getElementById('stock-form-view');
    const btnConfirmStock = document.getElementById('btn-confirm-register');

    if(btnOpenReg) btnOpenReg.addEventListener('click', () => { 
        viewDef.classList.add('hidden'); 
        viewForm.classList.remove('hidden'); 
        // Limpa e define "Automático" para o código (já que é SERIAL)
        const codeInput = document.getElementById('reg-code');
        if(codeInput) {
            codeInput.value = "Automático"; 
            codeInput.readOnly = true; 
        }
        formReg.reset(); // Limpa outros campos
        validateStockForm(); 
    });
    
    if(btnCancelReg) btnCancelReg.addEventListener('click', () => { 
        viewForm.classList.add('hidden'); 
        viewDef.classList.remove('hidden'); 
    });

    const validateStockForm = () => {
         const name = document.getElementById('reg-name')?.value;
         const price = document.getElementById('reg-price')?.value;
         const cat = document.getElementById('reg-category')?.value;
         if(btnConfirmStock) btnConfirmStock.disabled = !(name && price && cat);
    };

    if(formReg) {
        formReg.addEventListener('input', validateStockForm);
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const novoProduto = {
                // Não enviamos código, o banco gera
                nome: document.getElementById('reg-name').value,
                preco: parseFloat(document.getElementById('reg-price').value),
                categoria: document.getElementById('reg-category').value,
                estoque: 0 // Inicialmente 0
            };

            // Chama API
            const res = await window.App.criarProduto(novoProduto);
            
            if (res.ok) {
                showToast('Produto cadastrado!');
                viewForm.classList.add('hidden');
                viewDef.classList.remove('hidden');
                renderStock();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao cadastrar");
            }
        });
    }

    // --- EDIÇÃO (UPDATE) ---
    const editOverlay = document.getElementById('overlay-edit');
    const editForm = document.getElementById('form-edit');

    // Função global para abrir o modal (chamada pelo onclick do HTML)
    window.openEditModal = async (codigo) => {
        // Busca dados completos do produto
        const prod = await window.App.getProdutoPorCodigo(codigo);
        
        if(!prod) {
            showToast("Erro ao buscar produto", "error");
            return;
        }
        
        currentEditId = codigo; // Guarda o ID para salvar depois

        // Preenche o modal
        document.getElementById('edit-code').value = prod.codigo;
        document.getElementById('edit-name').value = prod.nome;
        document.getElementById('edit-price').value = prod.preco;
        
        const catSelect = document.getElementById('edit-category');
        if (prod.categoria) catSelect.value = prod.categoria;

        document.getElementById('edit-promo').value = prod.promocao || 0;
        document.getElementById('edit-qtd').value = prod.estoque || 0;
        
        updatePromoDisplay(); // Atualiza visual do desconto

        editOverlay.classList.remove('hidden');
    };

    // Atualiza display de preço com desconto no modal
    const updatePromoDisplay = () => {
        const price = parseFloat(document.getElementById('edit-price').value) || 0;
        const promo = parseFloat(document.getElementById('edit-promo').value) || 0;
        const final = price * (1 - (promo / 100));
        const display = document.getElementById('new-price-display');
        if(display) display.innerText = `R$ ${formatMoney(final)}`;
    };
    document.getElementById('edit-price')?.addEventListener('input', updatePromoDisplay);
    document.getElementById('edit-promo')?.addEventListener('input', updatePromoDisplay);

    document.getElementById('btn-cancel-edit').addEventListener('click', () => editOverlay.classList.add('hidden'));

    if(editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dadosUpdate = {
                nome: document.getElementById('edit-name').value,
                preco: parseFloat(document.getElementById('edit-price').value),
                categoria: document.getElementById('edit-category').value,
                promocao: document.getElementById('edit-promo').value,
                estoque: parseInt(document.getElementById('edit-qtd').value)
            };

            const res = await window.App.atualizarProduto(currentEditId, dadosUpdate);
            
            if(res.ok) {
                showToast('Produto atualizado!');
                editOverlay.classList.add('hidden');
                renderStock();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao atualizar");
            }
        });
    }

    // --- DELETE ---
    const btnDeleteInit = document.getElementById('btn-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    btnDeleteInit?.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    btnCancelDelete?.addEventListener('click', () => {
        deleteOverlay.classList.add('hidden');
    });

    // Clonar para remover listeners antigos
    const newBtnConfirm = btnConfirmDelete.cloneNode(true);
    btnConfirmDelete.parentNode.replaceChild(newBtnConfirm, btnConfirmDelete);

    newBtnConfirm.addEventListener('click', async () => {
        if (currentEditId) {
            const res = await window.App.deletarProduto(currentEditId);
            if (res.ok) {
                showToast('Produto removido!');
                deleteOverlay.classList.add('hidden');
                editOverlay.classList.add('hidden');
                renderStock();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao deletar");
            }
        }
    });
});