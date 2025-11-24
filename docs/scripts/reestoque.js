// scripts/reestoque.js

document.addEventListener('DOMContentLoaded', () => {
    
    const purchaseList = document.getElementById('purchase-list');
    if (!purchaseList) return;

    // Referências Globais
    let purchases = window.App.purchases;
    let products = window.App.products;
    let suppliers = window.App.suppliers;
    const { formatMoney, showToast, savePurchases } = window.App;

    // --- Datalists (Autocompletar) ---
    const setupDatalists = () => {
        const dlSup = document.getElementById('datalist-suppliers');
        const dlProd = document.getElementById('datalist-products');
        
        dlSup.innerHTML = '';
        suppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.cnpj;
            opt.label = s.name;
            dlSup.appendChild(opt);
        });

        dlProd.innerHTML = '';
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name; // Ou código se preferir
            opt.label = `Cód: ${p.code} - R$ ${p.price}`;
            dlProd.appendChild(opt);
        });
    };
    setupDatalists();

    // --- Renderização ---
    const renderPurchases = () => {
        purchaseList.innerHTML = '';
        
        // Filtros
        const generalFilter = document.getElementById('filter-general').value.toLowerCase();
        
        // Cálculos de Total
        let totalFiltered = 0;

        const filtered = purchases.filter(p => {
            const term = generalFilter;
            const matchNF = p.nf.toLowerCase().includes(term);
            const matchSupName = p.supplierName.toLowerCase().includes(term);
            const matchProdName = p.productName.toLowerCase().includes(term);
            
            // Filtros Avançados (Simplificado)
            // Para implementar filtros de data/preço, bastaria ler os inputs do #advanced-filters
            
            return matchNF || matchSupName || matchProdName;
        });

        filtered.forEach(p => {
            totalFiltered += p.total;
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
                <div class="stock-field-group pur-col-nf">
                    <label>Nota Fiscal</label>
                    <input type="text" value="${p.nf}" readonly class="stock-input">
                </div>
                <div class="stock-field-group pur-col-date">
                    <label>Data e hora</label>
                    <input type="text" value="${p.date} ${p.time}" readonly class="stock-input">
                </div>
                <div class="stock-field-group pur-col-sup">
                    <label>Fornecedor</label>
                    <input type="text" value="${p.supplierName}" readonly class="stock-input">
                </div>
                <div class="stock-field-group pur-col-cnpj">
                    <label>CNPJ</label>
                    <input type="text" value="${p.supplierCnpj}" readonly class="stock-input">
                </div>
                <div class="stock-field-group pur-col-prod">
                    <label>Produto</label>
                    <input type="text" value="${p.productName} (x${p.qtd})" readonly class="stock-input">
                </div>
                <div class="stock-field-group pur-col-total">
                    <label>Preço</label>
                    <input type="text" value="R$ ${formatMoney(p.total)}" readonly class="stock-input">
                </div>
                <div class="pur-col-btn">
                    <button class="btn-edit-stock" onclick="openEditPurchaseModal(${p.id})"><i class="fas fa-pen"></i></button>
                </div>
            `;
            purchaseList.appendChild(row);
        });

        document.getElementById('total-filtered-display').innerText = `R$ ${formatMoney(totalFiltered)}`;
        
        if (filtered.length === 0) {
            purchaseList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma compra encontrada.</p>';
        }
    };

    document.getElementById('filter-general').addEventListener('input', renderPurchases);
    renderPurchases();

    // --- Toggle Filtros Avançados ---
    document.getElementById('btn-toggle-filters').addEventListener('click', () => {
        document.getElementById('advanced-filters').classList.toggle('hidden');
    });

    // --- Nova Compra ---
    const btnNew = document.getElementById('btn-new-purchase');
    const overlay = document.getElementById('overlay-purchase');
    const form = document.getElementById('form-purchase');
    const btnDeleteInit = document.getElementById('btn-delete-purchase-init');
    let currentId = null;

    btnNew.addEventListener('click', () => {
        currentId = null;
        form.reset();
        // Preenche data/hora atual
        const now = new Date();
        document.getElementById('pur-date').valueAsDate = now;
        document.getElementById('pur-time').value = now.toTimeString().substring(0,5);
        
        document.getElementById('modal-purchase-title').innerText = 'REGISTRAR ENTRADA ESTOQUE';
        btnDeleteInit.classList.add('hidden');
        overlay.classList.remove('hidden');
    });

    // Auto-preencher Fornecedor pelo CNPJ
    document.getElementById('pur-cnpj').addEventListener('change', (e) => {
        const val = e.target.value;
        const sup = suppliers.find(s => s.cnpj === val);
        if(sup) {
            document.getElementById('pur-supplier-name').value = sup.name;
        }
    });

    // Salvar (Novo ou Edição)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newPurchase = {
            id: currentId || Date.now(),
            nf: document.getElementById('pur-nf').value,
            date: document.getElementById('pur-date').value,
            time: document.getElementById('pur-time').value,
            supplierCnpj: document.getElementById('pur-cnpj').value,
            supplierName: document.getElementById('pur-supplier-name').value,
            productName: document.getElementById('pur-product').value,
            qtd: parseInt(document.getElementById('pur-qtd').value),
            total: parseFloat(document.getElementById('pur-total').value)
        };

        if (currentId) {
            const idx = purchases.findIndex(p => p.id === currentId);
            if(idx > -1) purchases[idx] = newPurchase;
            showToast('Compra atualizada!');
        } else {
            purchases.push(newPurchase);
            showToast('Entrada registrada!');
        }

        savePurchases();
        renderPurchases();
        overlay.classList.add('hidden');
    });

    document.getElementById('btn-cancel-purchase').addEventListener('click', () => overlay.classList.add('hidden'));

    // --- Editar ---
    window.openEditPurchaseModal = (id) => {
        const p = purchases.find(x => x.id === id);
        if(!p) return;
        currentId = id;

        document.getElementById('modal-purchase-title').innerText = 'EDITAR COMPRA';
        document.getElementById('pur-nf').value = p.nf;
        document.getElementById('pur-date').value = p.date;
        document.getElementById('pur-time').value = p.time;
        document.getElementById('pur-cnpj').value = p.supplierCnpj;
        document.getElementById('pur-supplier-name').value = p.supplierName;
        document.getElementById('pur-product').value = p.productName;
        document.getElementById('pur-qtd').value = p.qtd;
        document.getElementById('pur-total').value = p.total;

        btnDeleteInit.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    // --- Deletar ---
    const deleteOverlay = document.getElementById('overlay-delete');
    
    btnDeleteInit.addEventListener('click', () => deleteOverlay.classList.remove('hidden'));
    document.getElementById('btn-cancel-delete').addEventListener('click', () => deleteOverlay.classList.add('hidden'));
    
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if(currentId) {
            const idx = purchases.findIndex(p => p.id === currentId);
            if(idx > -1) {
                purchases.splice(idx, 1);
                savePurchases();
                renderPurchases();
                showToast('Registro deletado!');
                overlay.classList.add('hidden');
                deleteOverlay.classList.add('hidden');
            }
        }
    });

});