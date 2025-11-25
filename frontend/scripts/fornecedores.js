// scripts/fornecedores.js

document.addEventListener('DOMContentLoaded', () => {
    
    const supplierList = document.getElementById('supplier-list');
    if (!supplierList) return;

    // Referências Globais
    let suppliers = window.App.suppliers;
    const { showToast, saveSuppliers } = window.App;
    let purchases = window.App.purchases || [];

    // --- Renderização da Lista ---
    const renderSuppliers = () => {
        supplierList.innerHTML = '';

        // Filtros
        const nameFilter = document.getElementById('filter-sup-name')?.value.toLowerCase() || '';
        const cnpjFilter = document.getElementById('filter-sup-cnpj')?.value || '';

        const filtered = suppliers.filter(s => {
            const matchName = s.name.toLowerCase().includes(nameFilter);
            const matchCnpj = s.cnpj.includes(cnpjFilter);
            return matchName && matchCnpj;
        });

        filtered.forEach(s => {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
                <div class="stock-field-group sup-col-name">
                    <label>Nome</label>
                    <input type="text" value="${s.name}" readonly class="stock-input">
                </div>
                <div class="stock-field-group sup-col-cnpj">
                    <label>CNPJ</label>
                    <input type="text" value="${s.cnpj}" readonly class="stock-input">
                </div>
                <div class="stock-field-group sup-col-email">
                    <label>E-mail</label>
                    <input type="text" value="${s.email}" readonly class="stock-input">
                </div>
                
                <div class="sup-col-btn" style="display:flex; gap:5px; justify-content: flex-end;">
                    <button class="btn-edit-stock" style="background-color: #555;" onclick="openSupplierDetails(${s.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit-stock" onclick="openEditSupplierModal(${s.id})">
                        <i class="fas fa-pen"></i>
                    </button>
                </div>
            `;
            supplierList.appendChild(row);
        });

        if (filtered.length === 0) {
            supplierList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum fornecedor encontrado.</p>';
        }
    };

    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderSuppliers);
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', renderSuppliers);
    });
    renderSuppliers();
    
    // --- Detalhes Fornecedor (Produtos) ---
    window.openSupplierDetails = (id) => {
        const s = suppliers.find(x => x.id === id);
        if(!s) return;
        document.getElementById('det-sup-name').value = s.name;
        
        const list = document.getElementById('det-sup-products');
        list.innerHTML = '';
        
        // Filtra compras feitas com este CNPJ (ou nome)
        const supplied = purchases.filter(p => p.supplierCnpj === s.cnpj || p.supplierName === s.name);
        
        if (supplied.length > 0) {
            // Remove duplicatas de produtos visualmente
            const uniqueProducts = [...new Set(supplied.map(item => item.productName))];
            uniqueProducts.forEach(prod => {
                list.innerHTML += `<div class="modal-list-item"><i class="fas fa-box"></i> ${prod}</div>`;
            });
        } else {
            list.innerHTML = '<div class="modal-list-item" style="color:#777;">Nenhum produto registrado em compras recentes.</div>';
        }
        
        document.getElementById('overlay-sup-details').classList.remove('hidden');
    };

    // --- Registrar Fornecedor ---
    const btnOpen = document.getElementById('btn-abrir-form-sup');
    const btnCancel = document.getElementById('btn-cancel-sup-reg');
    const viewDef = document.getElementById('sup-default-view');
    const viewForm = document.getElementById('sup-form-view');
    const formReg = document.getElementById('form-sup-register');
    const btnConfirm = document.getElementById('btn-confirm-sup-reg');

    if(btnOpen) btnOpen.addEventListener('click', () => { viewDef.classList.add('hidden'); viewForm.classList.remove('hidden'); });
    if(btnCancel) btnCancel.addEventListener('click', () => { viewForm.classList.add('hidden'); viewDef.classList.remove('hidden'); formReg.reset(); });

    const validateForm = () => {
        const cnpj = document.getElementById('reg-sup-cnpj').value;
        const name = document.getElementById('reg-sup-name').value;
        const email = document.getElementById('reg-sup-email').value;
        
        if(cnpj && name && email) btnConfirm.disabled = false;
        else btnConfirm.disabled = true;
    };

    if(formReg) {
        formReg.addEventListener('input', validateForm);
        formReg.addEventListener('submit', (e) => {
            e.preventDefault();
            const cnpj = document.getElementById('reg-sup-cnpj').value;
            const name = document.getElementById('reg-sup-name').value;
            const email = document.getElementById('reg-sup-email').value;

            const newSupplier = {
                id: Date.now(),
                cnpj: cnpj,
                name: name,
                email: email
            };

            suppliers.push(newSupplier);
            saveSuppliers();
            renderSuppliers();
            showToast('Fornecedor inserido com sucesso!');
            formReg.reset();
            viewForm.classList.add('hidden');
            viewDef.classList.remove('hidden');
        });
    }

    // --- Editar Fornecedor ---
    const editOverlay = document.getElementById('overlay-sup-edit');
    const editForm = document.getElementById('form-sup-edit');
    let currentId = null;

    window.openEditSupplierModal = (id) => {
        const s = suppliers.find(x => x.id === id);
        if(!s) return;
        currentId = id;

        document.getElementById('edit-sup-cnpj').value = s.cnpj;
        document.getElementById('edit-sup-name').value = s.name;
        document.getElementById('edit-sup-email').value = s.email;

        editOverlay.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-sup-edit').addEventListener('click', () => editOverlay.classList.add('hidden'));

    editForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = suppliers.findIndex(x => x.id === currentId);
        if (idx > -1) {
            suppliers[idx].name = document.getElementById('edit-sup-name').value;
            suppliers[idx].email = document.getElementById('edit-sup-email').value;
            
            saveSuppliers();
            renderSuppliers();
            showToast('Fornecedor editado com sucesso!');
            editOverlay.classList.add('hidden');
        }
    });

    // --- Deletar Fornecedor ---
    const btnDeleteInit = document.getElementById('btn-sup-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    btnDeleteInit?.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    btnCancelDelete?.addEventListener('click', () => {
        deleteOverlay.classList.add('hidden');
    });

    const newBtnConfirm = btnConfirmDelete.cloneNode(true);
    btnConfirmDelete.parentNode.replaceChild(newBtnConfirm, btnConfirmDelete);

    newBtnConfirm.addEventListener('click', () => {
        if (currentId) {
            const idx = suppliers.findIndex(s => s.id === currentId);
            if(idx > -1) {
                suppliers.splice(idx, 1);
                saveSuppliers();
                renderSuppliers();
                showToast('Fornecedor removido com sucesso!');
                editOverlay.classList.add('hidden');
                deleteOverlay.classList.add('hidden');
            }
        }
    });
});