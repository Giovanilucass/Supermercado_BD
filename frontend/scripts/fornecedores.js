// frontend/scripts/fornecedores.js

document.addEventListener('DOMContentLoaded', () => {
    
    const supplierList = document.getElementById('supplier-list');
    if (!supplierList) return;

    const { showToast } = window.App;
    let currentCnpjEdit = null;

    // --- RENDERIZAÇÃO ---
    const renderSuppliers = async () => {
        supplierList.innerHTML = '<p style="text-align:center; padding:20px;">Carregando fornecedores...</p>';

        // Filtros
        const nameFilter = document.getElementById('filter-sup-name')?.value || '';
        const cnpjFilter = document.getElementById('filter-sup-cnpj')?.value || '';

        const filtros = {
            nome: nameFilter,
            cnpj: cnpjFilter
        };

        try {
            const suppliers = await window.App.getFornecedores(filtros);
            
            supplierList.innerHTML = '';

            if (!suppliers || suppliers.length === 0) {
                supplierList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum fornecedor encontrado.</p>';
                return;
            }

            suppliers.forEach(s => {
                const row = document.createElement('div');
                row.className = 'stock-item-row';
                row.innerHTML = `
                    <div class="stock-field-group sup-col-name">
                        <label>Nome</label>
                        <input type="text" value="${s.nome}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group sup-col-cnpj">
                        <label>CNPJ</label>
                        <input type="text" value="${s.cnpj}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group sup-col-email">
                        <label>E-mail</label>
                        <input type="text" value="${s.email || '-'}" readonly class="stock-input">
                    </div>
                    
                    <div class="sup-col-btn" style="display:flex; gap:5px; justify-content: flex-end;">
                        <button class="btn-edit-stock" style="background-color: #555;" onclick="window.openSupplierDetails('${s.cnpj}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit-stock" onclick="window.openEditSupplierModal('${s.cnpj}')">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
                supplierList.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            supplierList.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar dados.</p>';
        }
    };

    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderSuppliers);
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('change', renderSuppliers);
    });
    renderSuppliers();
    
    // --- DETALHES (PRODUTOS DO FORNECEDOR) ---
    window.openSupplierDetails = async (cnpj) => {
        // Primeiro buscamos o nome do fornecedor (seja da lista ou via api, aqui vamos via api pra garantir)
        const fornecedor = await window.App.getFornecedorPorCnpj(cnpj);
        if (!fornecedor) return;

        document.getElementById('det-sup-name').value = fornecedor.nome;
        
        const listBox = document.getElementById('det-sup-products');
        listBox.innerHTML = '<p style="padding:10px;">Carregando produtos...</p>';
        document.getElementById('overlay-sup-details').classList.remove('hidden');

        // Busca produtos
        const produtos = await window.App.getProdutosFornecedor(cnpj);
        
        listBox.innerHTML = '';
        if (produtos && produtos.length > 0) {
            produtos.forEach(prod => {
                // Backend retorna {codigo, nome}
                listBox.innerHTML += `<div class="modal-list-item"><i class="fas fa-box"></i> ${prod.nome}</div>`;
            });
        } else {
            listBox.innerHTML = '<div class="modal-list-item" style="color:#777;">Nenhum produto vinculado a este fornecedor.</div>';
        }
    };

    // --- REGISTRO ---
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
        if(btnConfirm) btnConfirm.disabled = !(cnpj && name && email);
    };

    if(formReg) {
        formReg.addEventListener('input', validateForm);
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const novoFornecedor = {
                cnpj: document.getElementById('reg-sup-cnpj').value,
                nome: document.getElementById('reg-sup-name').value,
                email: document.getElementById('reg-sup-email').value
            };

            const res = await window.App.criarFornecedor(novoFornecedor);

            if (res.ok) {
                showToast('Fornecedor cadastrado!');
                formReg.reset();
                viewForm.classList.add('hidden');
                viewDef.classList.remove('hidden');
                renderSuppliers();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao cadastrar");
            }
        });
    }

    // --- EDIÇÃO ---
    const editOverlay = document.getElementById('overlay-sup-edit');
    const editForm = document.getElementById('form-sup-edit');

    window.openEditSupplierModal = async (cnpj) => {
        const s = await window.App.getFornecedorPorCnpj(cnpj);
        if(!s) {
            showToast("Erro ao buscar fornecedor", "error");
            return;
        }
        
        currentCnpjEdit = cnpj;

        document.getElementById('edit-sup-cnpj').value = s.cnpj;
        document.getElementById('edit-sup-name').value = s.nome;
        document.getElementById('edit-sup-email').value = s.email;

        editOverlay.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-sup-edit')?.addEventListener('click', () => editOverlay.classList.add('hidden'));

    if(editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dadosUpdate = {
                cnpj: currentCnpjEdit, // Necessário para o WHERE
                nome: document.getElementById('edit-sup-name').value,
                email: document.getElementById('edit-sup-email').value
            };

            const res = await window.App.atualizarFornecedor(dadosUpdate);
            
            if(res.ok) {
                showToast('Fornecedor atualizado!');
                editOverlay.classList.add('hidden');
                renderSuppliers();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao atualizar");
            }
        });
    }

    // --- DELETAR ---
    const btnDeleteInit = document.getElementById('btn-sup-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    btnDeleteInit?.addEventListener('click', () => deleteOverlay.classList.remove('hidden'));
    btnCancelDelete?.addEventListener('click', () => deleteOverlay.classList.add('hidden'));

    // Hack para limpar listeners
    const newBtnConfirm = btnConfirmDelete.cloneNode(true);
    btnConfirmDelete.parentNode.replaceChild(newBtnConfirm, btnConfirmDelete);

    newBtnConfirm.addEventListener('click', async () => {
        if (currentCnpjEdit) {
            const res = await window.App.deletarFornecedor(currentCnpjEdit);
            if(res.ok) {
                showToast('Fornecedor removido!');
                editOverlay.classList.add('hidden');
                deleteOverlay.classList.add('hidden');
                renderSuppliers();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao deletar");
            }
        }
    });
});