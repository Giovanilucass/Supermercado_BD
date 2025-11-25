// js/estoque.js

document.addEventListener('DOMContentLoaded', () => {
    
    const stockList = document.getElementById('stock-list');
    if (!stockList) return;

    // Referências Locais
    let products = window.App.products;
    const { formatMoney, generateCode, showToast } = window.App;

    // --- Renderização ---
    const renderStock = () => {
        stockList.innerHTML = '';
        
        const nameFilter = document.getElementById('search-name')?.value.toLowerCase() || '';
        const codeFilter = document.getElementById('search-code')?.value || '';
        const catFilter = document.getElementById('filter-category')?.value || '';
        const promoFilter = document.getElementById('filter-promo')?.checked || false;
        const endingFilter = document.getElementById('filter-ending')?.checked || false;
        const sortType = document.getElementById('sort-products')?.value || 'default';

        let filtered = products.filter(p => {
            const matchName = p.name.toLowerCase().includes(nameFilter);
            const matchCode = p.code.replace(/\s/g, '').includes(codeFilter.replace(/\s/g, ''));
            const matchCat = catFilter === '' || p.category === catFilter;
            const matchPromo = !promoFilter || p.promo > 0;
            const matchEnding = !endingFilter || p.ending || p.qtd < 10;
            return matchName && matchCode && matchCat && matchPromo && matchEnding;
        });

        // Lógica de Ordenação
        if (sortType === 'sold-desc') {
            filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        } else if (sortType === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortType === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        filtered.forEach(p => {
            const finalPrice = p.price * (1 - (p.promo / 100));
            const item = document.createElement('div');
            item.className = 'stock-item-row';
            // Adicionei um pequeno indicador de vendas (title) para conferência
            item.innerHTML = `
                <div class="stock-field-group code-col"><label>Código</label><input type="text" value="${p.code}" readonly class="stock-input"></div>
                <div class="stock-field-group name-col"><label>Nome ${p.sold ? '<span style="font-size:9px;color:#666">('+p.sold+' vend.)</span>' : ''}</label><input type="text" value="${p.name}" class="stock-input" readonly></div>
                <div class="stock-field-group price-col"><label>Preço ${p.promo > 0 ? '(-' + p.promo + '%)' : ''}</label><div class="price-input-wrapper"><span>R$</span><input type="text" value="${formatMoney(finalPrice)}" class="stock-input-transparent" readonly></div></div>
                <div class="stock-field-group cat-col"><label>Categoria</label><input type="text" value="${p.category}" class="stock-input" readonly></div>
                <button class="btn-edit-stock" onclick="openEditModal(${p.id})"><i class="fas fa-pen"></i></button>
            `;
            stockList.appendChild(item);
        });
    };

    // Listeners
    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderStock);
    document.querySelectorAll('.filter-input, .filter-select, .switch input').forEach(el => {
        el.addEventListener('input', renderStock);
        el.addEventListener('change', renderStock); // Isso pega a mudança do select de ordenação
    });
    
    renderStock();

    // --- Registrar Produto ---
    const btnOpenReg = document.getElementById('btn-abrir-form-estoque');
    const btnCancelReg = document.getElementById('btn-cancelar-estoque');
    const formReg = document.getElementById('form-register');
    const viewDef = document.getElementById('stock-default-view');
    const viewForm = document.getElementById('stock-form-view');
    const btnConfirmStock = document.getElementById('btn-confirm-register');

    if(btnOpenReg) btnOpenReg.addEventListener('click', () => { 
        viewDef.classList.add('hidden'); 
        viewForm.classList.remove('hidden'); 
        document.getElementById('reg-code').value = generateCode();
        validateStockForm(); 
    });
    
    if(btnCancelReg) btnCancelReg.addEventListener('click', () => { 
        viewForm.classList.add('hidden'); 
        viewDef.classList.remove('hidden'); 
        formReg.reset(); 
    });

    const validateStockForm = () => {
         const name = document.getElementById('reg-name')?.value;
         const price = document.getElementById('reg-price')?.value;
         const cat = document.getElementById('reg-category')?.value;
         if(btnConfirmStock) btnConfirmStock.disabled = !(name && price && cat);
    };

    if(formReg) {
        formReg.addEventListener('input', validateStockForm);
        formReg.addEventListener('change', validateStockForm);
        formReg.addEventListener('submit', (e) => {
            e.preventDefault();
            products.push({
                id: Date.now(),
                code: document.getElementById('reg-code').value,
                name: document.getElementById('reg-name').value,
                price: parseFloat(document.getElementById('reg-price').value),
                category: document.getElementById('reg-category').value,
                promo: 0, ending: false, qtd: 100
            });
            window.App.saveProducts(); // CORREÇÃO: Chamada direta
            renderStock();
            showToast('Produto inserido com sucesso!');
            formReg.reset();
            viewForm.classList.add('hidden');
            viewDef.classList.remove('hidden');
        });
    }

    // --- Edição e Delete ---
    const editOverlay = document.getElementById('overlay-edit');
    const editForm = document.getElementById('form-edit');
    let currentEditId = null;

    window.openEditModal = (id) => {
        const p = products.find(x => x.id === id);
        if(!p) return;
        currentEditId = id;
        document.getElementById('edit-code').value = p.code;
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-price').value = p.price;
        document.getElementById('edit-category').value = p.category;
        document.getElementById('edit-promo').value = p.promo;
        document.getElementById('edit-qtd').value = p.qtd;
        editOverlay.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-edit').addEventListener('click', () => editOverlay.classList.add('hidden'));

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = products.findIndex(x => x.id === currentEditId);
        if(idx > -1) {
            products[idx].name = document.getElementById('edit-name').value;
            products[idx].price = parseFloat(document.getElementById('edit-price').value);
            products[idx].promo = parseFloat(document.getElementById('edit-promo').value);
            products[idx].qtd = parseInt(document.getElementById('edit-qtd').value);
            window.App.saveProducts(); // CORREÇÃO: Chamada direta
            renderStock();
            showToast('Produto editado com sucesso!');
            editOverlay.classList.add('hidden');
        }
    });

    const btnDeleteInit = document.getElementById('btn-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    btnDeleteInit?.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    btnConfirmDelete.addEventListener('click', () => {
        const idx = products.findIndex(p => p.id === currentEditId);
        if(idx > -1) {
            products.splice(idx, 1);
            window.App.saveProducts(); // CORREÇÃO: Chamada direta
            renderStock();
            showToast('Produto removido com sucesso!');
            document.getElementById('overlay-edit').classList.add('hidden');
            deleteOverlay.classList.add('hidden');
        }
    });

    btnCancelDelete.addEventListener('click', () => deleteOverlay.classList.add('hidden'));
});