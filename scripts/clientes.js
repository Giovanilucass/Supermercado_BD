// scripts/clientes.js

document.addEventListener('DOMContentLoaded', () => {
    
    const clientList = document.getElementById('client-list');
    if (!clientList) return;

    // Referências Globais
    let clients = window.App.clients;
    const { showToast, saveClients } = window.App;

    // --- Renderização da Lista ---
    const renderClients = () => {
        clientList.innerHTML = '';

        // Filtros
        const nameFilter = document.getElementById('filter-cli-name')?.value.toLowerCase() || '';
        const cpfFilter = document.getElementById('filter-cli-cpf')?.value || '';
        const yearMin = parseInt(document.getElementById('filter-year-min')?.value) || 0;
        const yearMax = parseInt(document.getElementById('filter-year-max')?.value) || 9999;

        const filtered = clients.filter(c => {
            // Filtro Nome e CPF
            const matchName = c.name.toLowerCase().includes(nameFilter);
            const matchCpf = c.cpf.includes(cpfFilter);
            
            // Filtro Ano de Nascimento
            let matchYear = true;
            if (c.dob) {
                const parts = c.dob.split('/'); // DD/MM/YYYY
                if (parts.length === 3) {
                    const year = parseInt(parts[2]);
                    if (year < yearMin || year > yearMax) matchYear = false;
                }
            }

            return matchName && matchCpf && matchYear;
        });

        filtered.forEach(c => {
            const row = document.createElement('div');
            row.className = 'stock-item-row'; // Reutilizando classe de linha
            row.innerHTML = `
                <div class="stock-field-group cli-col-name">
                    <label>Nome</label>
                    <input type="text" value="${c.name}" readonly class="stock-input">
                </div>
                <div class="stock-field-group cli-col-cpf">
                    <label>CPF</label>
                    <input type="text" value="${c.cpf}" readonly class="stock-input">
                </div>
                <div class="stock-field-group cli-col-dob">
                    <label>Data de Nascimento</label>
                    <input type="text" value="${c.dob || '--/--/----'}" readonly class="stock-input">
                </div>
                <div class="cli-col-btn">
                    <button class="btn-edit-stock" onclick="openEditClientModal(${c.id})">
                        <i class="fas fa-pen"></i>
                    </button>
                </div>
            `;
            clientList.appendChild(row);
        });

        if (filtered.length === 0) {
            clientList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum cliente encontrado.</p>';
        }
    };

    // Listeners de Filtro
    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderClients);
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', renderClients);
    });
    renderClients();

    // --- Registrar Cliente (Sidebar) ---
    const btnOpen = document.getElementById('btn-abrir-form-cli');
    const btnCancel = document.getElementById('btn-cancel-cli-reg');
    const viewDef = document.getElementById('cli-default-view');
    const viewForm = document.getElementById('cli-form-view');
    const formReg = document.getElementById('form-cli-register');
    const btnConfirm = document.getElementById('btn-confirm-cli-reg');

    if(btnOpen) btnOpen.addEventListener('click', () => { viewDef.classList.add('hidden'); viewForm.classList.remove('hidden'); });
    if(btnCancel) btnCancel.addEventListener('click', () => { viewForm.classList.add('hidden'); viewDef.classList.remove('hidden'); formReg.reset(); });

    const validateForm = () => {
        const cpf = document.getElementById('reg-cli-cpf').value;
        const name = document.getElementById('reg-cli-name').value;
        const dd = document.getElementById('reg-cli-dd').value;
        const mm = document.getElementById('reg-cli-mm').value;
        const yyyy = document.getElementById('reg-cli-yyyy').value;
        
        // CPF, Nome e Data são obrigatórios
        if(cpf && name && dd && mm && yyyy) btnConfirm.disabled = false;
        else btnConfirm.disabled = true;
    };

    if(formReg) {
        formReg.addEventListener('input', validateForm);
        formReg.addEventListener('submit', (e) => {
            e.preventDefault();
            const dd = document.getElementById('reg-cli-dd').value;
            const mm = document.getElementById('reg-cli-mm').value;
            const yyyy = document.getElementById('reg-cli-yyyy').value;

            const newClient = {
                id: Date.now(),
                cpf: document.getElementById('reg-cli-cpf').value,
                name: document.getElementById('reg-cli-name').value,
                dob: `${dd}/${mm}/${yyyy}`,
                phone1: document.getElementById('reg-cli-phone1').value,
                type1: document.getElementById('reg-cli-type1').value,
                phone2: document.getElementById('reg-cli-phone2').value,
                type2: document.getElementById('reg-cli-type2').value
            };

            clients.push(newClient);
            saveClients(); // Global save
            renderClients();
            showToast('Cliente inserido com sucesso!');
            formReg.reset();
            viewForm.classList.add('hidden');
            viewDef.classList.remove('hidden');
        });
    }

    // --- Editar Cliente ---
    const editOverlay = document.getElementById('overlay-cli-edit');
    const editForm = document.getElementById('form-cli-edit');
    let currentId = null;

    window.openEditClientModal = (id) => {
        const c = clients.find(x => x.id === id);
        if(!c) return;
        currentId = id;

        document.getElementById('edit-cli-cpf').value = c.cpf;
        document.getElementById('edit-cli-name').value = c.name;
        document.getElementById('edit-cli-phone1').value = c.phone1 || '';
        document.getElementById('edit-cli-type1').value = c.type1 || 'Celular';
        document.getElementById('edit-cli-phone2').value = c.phone2 || '';
        document.getElementById('edit-cli-type2').value = c.type2 || 'Celular';

        if(c.dob) {
            const [d, m, y] = c.dob.split('/');
            document.getElementById('edit-cli-dd').value = d;
            document.getElementById('edit-cli-mm').value = m;
            document.getElementById('edit-cli-yyyy').value = y;
        } else {
            document.getElementById('edit-cli-dd').value = '';
            document.getElementById('edit-cli-mm').value = '';
            document.getElementById('edit-cli-yyyy').value = '';
        }

        editOverlay.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-cli-edit').addEventListener('click', () => editOverlay.classList.add('hidden'));

    editForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = clients.findIndex(x => x.id === currentId);
        if (idx > -1) {
            const d = document.getElementById('edit-cli-dd').value;
            const m = document.getElementById('edit-cli-mm').value;
            const y = document.getElementById('edit-cli-yyyy').value;

            clients[idx].name = document.getElementById('edit-cli-name').value;
            clients[idx].dob = `${d}/${m}/${y}`;
            clients[idx].phone1 = document.getElementById('edit-cli-phone1').value;
            clients[idx].type1 = document.getElementById('edit-cli-type1').value;
            clients[idx].phone2 = document.getElementById('edit-cli-phone2').value;
            clients[idx].type2 = document.getElementById('edit-cli-type2').value;

            saveClients();
            renderClients();
            showToast('Cliente editado com sucesso!');
            editOverlay.classList.add('hidden');
        }
    });

    // --- Deletar Cliente (Lógica no shared.js ou aqui) ---
    // Como o shared.js tem a lógica genérica de delete, precisamos apenas configurar o botão de delete
    const btnDeleteInit = document.getElementById('btn-cli-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    
    // Precisamos injetar a lógica específica de delete para cliente
    // NOTA: O shared.js lida com 'product' e 'employee'. Precisamos adicionar 'client' aqui ou lá.
    // Para simplificar e não mexer no shared.js novamente, faremos a lógica de delete localmente aqui.
    
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    // Abre modal
    btnDeleteInit?.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    // Fecha modal
    btnCancelDelete?.addEventListener('click', () => {
        deleteOverlay.classList.add('hidden');
    });

    // Ação de Confirmar (Precisamos sobrescrever ou adicionar listener com cuidado)
    // Uma abordagem segura é usar uma variável global de controle no shared, mas aqui faremos local.
    
    // Hack: Vamos remover listeners antigos do botão confirm clonando-o, para evitar conflito com estoque.js
    // Em um projeto real, isso seria centralizado.
    const newBtnConfirm = btnConfirmDelete.cloneNode(true);
    btnConfirmDelete.parentNode.replaceChild(newBtnConfirm, btnConfirmDelete);

    newBtnConfirm.addEventListener('click', () => {
        if (currentId) {
            const idx = clients.findIndex(c => c.id === currentId);
            if(idx > -1) {
                clients.splice(idx, 1);
                saveClients();
                renderClients();
                showToast('Cliente removido com sucesso!');
                editOverlay.classList.add('hidden');
                deleteOverlay.classList.add('hidden');
            }
        }
    });

});