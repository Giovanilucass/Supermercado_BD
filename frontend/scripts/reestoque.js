// scripts/reestoque.js

document.addEventListener('DOMContentLoaded', () => {
    
    const purchaseList = document.getElementById('purchase-list');
    if (!purchaseList) return;

    // Referências Globais
    let purchases = window.App.purchases || [];
    let products = window.App.products || [];
    let suppliers = window.App.suppliers || [];
    const { formatMoney, showToast, savePurchases } = window.App;

    // --- Datalists (Autocompletar) ---
    const setupDatalists = () => {
        const dlSup = document.getElementById('datalist-suppliers');
        const dlProd = document.getElementById('datalist-products');
        
        if (dlSup) {
            dlSup.innerHTML = '';
            suppliers.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.cnpj;
                opt.label = s.name;
                dlSup.appendChild(opt);
            });
        }

        if (dlProd) {
            dlProd.innerHTML = '';
            products.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name; 
                opt.label = `Cód: ${p.code} - R$ ${formatMoney(p.price)}`;
                dlProd.appendChild(opt);
            });
        }
    };
    setupDatalists();

    // --- Renderização ---
    const renderPurchases = () => {
        purchaseList.innerHTML = '';
        
        // Captura Filtros com Segurança
        const generalInput = document.getElementById('filter-general');
        const generalFilter = generalInput ? generalInput.value.toLowerCase() : '';
        
        const dateMinInput = document.getElementById('filter-date-min');
        const dateMin = dateMinInput ? dateMinInput.value : '';
        
        const dateMaxInput = document.getElementById('filter-date-max');
        const dateMax = dateMaxInput ? dateMaxInput.value : '';
        
        const valMinInput = document.getElementById('filter-val-min');
        const valMin = valMinInput ? (parseFloat(valMinInput.value) || 0) : 0;
        
        const valMaxInput = document.getElementById('filter-val-max');
        const valMax = valMaxInput ? (parseFloat(valMaxInput.value) || Infinity) : Infinity;

        let totalFiltered = 0;

        const filtered = purchases.filter(p => {
            if (!p) return false; // Ignora itens nulos

            // Proteção: Garante que as propriedades existam antes de usar toLowerCase
            const nfText = (p.nf || '').toLowerCase();
            const supText = (p.supplierName || '').toLowerCase();
            const prodText = (p.productName || '').toLowerCase();
            
            // Filtro Texto
            const matchText = nfText.includes(generalFilter) ||
                              supText.includes(generalFilter) ||
                              prodText.includes(generalFilter);
            
            // Filtro Valor
            const pTotal = p.total || 0;
            const matchVal = pTotal >= valMin && pTotal <= valMax;

            // Filtro Data
            let matchDate = true;
            if (p.date) {
                if (dateMin && p.date < dateMin) matchDate = false;
                if (dateMax && p.date > dateMax) matchDate = false;
            }

            return matchText && matchVal && matchDate;
        });

        filtered.forEach(p => {
            totalFiltered += (p.total || 0);
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
                <div class="stock-field-group pur-col-nf"><label>Nota Fiscal</label><input type="text" value="${p.nf || '-'}" readonly class="stock-input"></div>
                <div class="stock-field-group pur-col-date"><label>Data</label><input type="text" value="${p.date || ''} ${p.time || ''}" readonly class="stock-input"></div>
                <div class="stock-field-group pur-col-sup"><label>Fornecedor</label><input type="text" value="${p.supplierName || '-'}" readonly class="stock-input"></div>
                <div class="stock-field-group pur-col-prod"><label>Produto</label><input type="text" value="${p.productName || '-'}" readonly class="stock-input"></div>
                <div class="stock-field-group pur-col-qtd"><label>Qtd.</label><input type="text" value="${p.qtd || 0}" readonly class="stock-input" style="text-align:center;"></div>
                <div class="stock-field-group pur-col-total"><label>Total</label><input type="text" value="R$ ${formatMoney(p.total)}" readonly class="stock-input" style="text-align:right; font-weight:bold;"></div>
                <div class="pur-col-btn">
                    <button class="btn-edit-stock" onclick="openEditPurchaseModal(${p.id})"><i class="fas fa-pen"></i></button>
                </div>
            `;
            purchaseList.appendChild(row);
        });

        const totalDisplay = document.getElementById('total-filtered-display');
        if(totalDisplay) totalDisplay.innerText = `R$ ${formatMoney(totalFiltered)}`;
        
        if (filtered.length === 0) {
            purchaseList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma compra encontrada.</p>';
        }
    };

    // Listeners de Filtros
    const btnFilter = document.getElementById('btn-filter-trigger');
    if(btnFilter) btnFilter.addEventListener('click', renderPurchases);
    
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', renderPurchases);
        input.addEventListener('change', renderPurchases);
    });
    
    renderPurchases(); // Renderiza ao carregar

    // --- Nova Compra ---
    const btnNew = document.getElementById('btn-new-purchase');
    const overlay = document.getElementById('overlay-purchase');
    const form = document.getElementById('form-purchase');
    const btnDeleteInit = document.getElementById('btn-delete-purchase-init');
    let currentId = null;

    if (btnNew) {
        btnNew.addEventListener('click', () => {
            currentId = null;
            if(form) form.reset();
            const now = new Date();
            // Formata data para YYYY-MM-DD para input date
            const isoDate = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().substring(0,5);
            
            const dateInput = document.getElementById('pur-date');
            if(dateInput) dateInput.value = isoDate;
            
            const timeInput = document.getElementById('pur-time');
            if(timeInput) timeInput.value = timeStr;
            
            document.getElementById('modal-purchase-title').innerText = 'REGISTRAR ENTRADA ESTOQUE';
            btnDeleteInit.classList.add('hidden');
            overlay.classList.remove('hidden');
        });
    }

    // Auto-preencher Fornecedor
    const cnpjInput = document.getElementById('pur-cnpj');
    if (cnpjInput) {
        cnpjInput.addEventListener('change', (e) => {
            const val = e.target.value;
            const sup = suppliers.find(s => s.cnpj === val);
            if(sup) document.getElementById('pur-supplier-name').value = sup.name;
        });
    }

    // Salvar
    if (form) {
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
    }

    const btnCancel = document.getElementById('btn-cancel-purchase');
    if(btnCancel) btnCancel.addEventListener('click', () => overlay.classList.add('hidden'));

    // --- Editar ---
    window.openEditPurchaseModal = (id) => {
        const p = purchases.find(x => x.id === id);
        if(!p) return;
        currentId = id;

        document.getElementById('modal-purchase-title').innerText = 'EDITAR COMPRA';
        document.getElementById('pur-nf').value = p.nf || '';
        document.getElementById('pur-date').value = p.date || '';
        document.getElementById('pur-time').value = p.time || '';
        document.getElementById('pur-cnpj').value = p.supplierCnpj || '';
        document.getElementById('pur-supplier-name').value = p.supplierName || '';
        document.getElementById('pur-product').value = p.productName || '';
        document.getElementById('pur-qtd').value = p.qtd || 0;
        document.getElementById('pur-total').value = p.total || 0;

        btnDeleteInit.classList.remove('hidden');
        overlay.classList.remove('hidden');
    };

    // --- Deletar ---
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    
    if (btnDeleteInit) {
        btnDeleteInit.addEventListener('click', () => deleteOverlay.classList.remove('hidden'));
    }
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', () => deleteOverlay.classList.add('hidden'));
    }
    
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', () => {
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
    }
});