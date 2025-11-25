// scripts/clientes.js

document.addEventListener('DOMContentLoaded', () => {
    
    const clientList = document.getElementById('client-list');
    if (!clientList) return;

    const { showToast } = window.App;
    
    // Variável para armazenar dados temporariamente para edição (evita buscar no banco de novo)
    let loadedClients = [];

    // --- RENDERIZAÇÃO (Busca no Backend) ---
    const renderClients = async () => {
        clientList.innerHTML = '<p style="text-align:center; padding:20px;">Carregando...</p>';

        // Coleta filtros
        const filtros = {
            nome: document.getElementById('filter-cli-name').value,
            cpf: document.getElementById('filter-cli-cpf').value,
            min: document.getElementById('filter-year-min').value, // Backend espera 'min'
            max: document.getElementById('filter-year-max').value  // Backend espera 'max'
        };

        try {
            // CHAMA O PYTHON!
            loadedClients = await window.App.getClientes(filtros);
            
            clientList.innerHTML = '';
            
            if (loadedClients.length === 0) {
                clientList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum cliente encontrado no banco de dados.</p>';
                return;
            }

            loadedClients.forEach(c => {
                const row = document.createElement('div');
                row.className = 'stock-item-row';
                row.innerHTML = `
                    <div class="stock-field-group cli-col-name">
                        <label>Nome</label>
                        <input type="text" value="${c.nome}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group cli-col-cpf">
                        <label>CPF</label>
                        <input type="text" value="${c.cpf}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group cli-col-dob">
                        <label>Data de Nascimento</label>
                        <input type="text" value="${c.data_nascimento || '--'}" readonly class="stock-input">
                    </div>
                    
                    <div class="cli-col-btn" style="display: flex; gap: 5px; justify-content: flex-end;">
                        <button class="btn-edit-stock" style="background-color: #555;" onclick="openClientDetails('${c.cpf}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-edit-stock" onclick="openEditClientModal('${c.cpf}')">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
                clientList.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            clientList.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar clientes.</p>';
        }
    };

    // Listeners de Filtro
    document.getElementById('btn-filter-trigger').addEventListener('click', renderClients);
    // Opcional: Buscar ao digitar (pode ficar lento com BD real, melhor deixar só no botão ou com delay)
    
    // Carrega ao iniciar
    renderClients();


    // --- DETALHES (CONSULTA EXTRA) ---
    window.openClientDetails = async (cpf) => {
        // Fazemos uma nova busca específica para pegar os telefones atualizados
        const res = await fetch(`${API_BASE_URL}/clientes/consultar?cpf=${cpf}`);
        if(res.ok) {
            const c = await res.json();
            
            document.getElementById('det-cli-name').value = c.nome;
            document.getElementById('det-cli-cpf').value = c.cpf;
            
            const list = document.getElementById('det-cli-phones');
            list.innerHTML = '';
            
            if(c.telefones && c.telefones.length > 0) {
                c.telefones.forEach(tel => {
                    list.innerHTML += `<div class="modal-list-item"><strong>${tel.tipo}:</strong> ${tel.numero}</div>`;
                });
            } else {
                list.innerHTML = '<div class="modal-list-item" style="color:#777;">Nenhum telefone cadastrado.</div>';
            }
            document.getElementById('overlay-cli-details').classList.remove('hidden');
        } else {
            showToast("Erro ao buscar detalhes do cliente.", "error");
        }
    };


    // --- REGISTRAR ---
    const formReg = document.getElementById('form-cli-register');
    const btnConfirm = document.getElementById('btn-confirm-cli-reg');
    
    // Validação Visual
    const validateForm = () => {
        const cpf = document.getElementById('reg-cli-cpf').value;
        const name = document.getElementById('reg-cli-name').value;
        const dd = document.getElementById('reg-cli-dd').value;
        const mm = document.getElementById('reg-cli-mm').value;
        const yyyy = document.getElementById('reg-cli-yyyy').value;
        btnConfirm.disabled = !(cpf && name && dd && mm && yyyy);
    };

    if(formReg) {
        formReg.addEventListener('input', validateForm);
        
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Monta objeto igual o Python espera
            const telefones = [];
            if(document.getElementById('reg-cli-phone1').value) {
                telefones.push({ 
                    numero: document.getElementById('reg-cli-phone1').value, 
                    tipo: document.getElementById('reg-cli-type1').value 
                });
            }
            if(document.getElementById('reg-cli-phone2').value) {
                telefones.push({ 
                    numero: document.getElementById('reg-cli-phone2').value, 
                    tipo: document.getElementById('reg-cli-type2').value 
                });
            }

            const dados = {
                cpf: document.getElementById('reg-cli-cpf').value,
                nome: document.getElementById('reg-cli-name').value,
                data_nascimento: `${document.getElementById('reg-cli-dd').value}/${document.getElementById('reg-cli-mm').value}/${document.getElementById('reg-cli-yyyy').value}`,
                telefones: telefones
            };

            const res = await window.App.criarCliente(dados);
            
            if (res.ok) {
                showToast('Cliente cadastrado com sucesso!');
                formReg.reset();
                document.getElementById('cli-form-view').classList.add('hidden');
                document.getElementById('cli-default-view').classList.remove('hidden');
                renderClients(); // Recarrega a lista
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao cadastrar");
            }
        });
    }
    
    // Botões de alternância de view (registro)
    document.getElementById('btn-abrir-form-cli').addEventListener('click', () => {
        document.getElementById('cli-default-view').classList.add('hidden');
        document.getElementById('cli-form-view').classList.remove('hidden');
    });
    document.getElementById('btn-cancel-cli-reg').addEventListener('click', () => {
        document.getElementById('cli-form-view').classList.add('hidden');
        document.getElementById('cli-default-view').classList.remove('hidden');
    });


    // --- EDITAR ---
    const editOverlay = document.getElementById('overlay-cli-edit');
    let currentCpfEdit = null;

    window.openEditClientModal = async (cpf) => {
        // Busca dados frescos para edição
        const res = await fetch(`${API_BASE_URL}/clientes/consultar?cpf=${cpf}`);
        if(!res.ok) return;
        
        const c = await res.json();
        currentCpfEdit = cpf;

        document.getElementById('edit-cli-cpf').value = c.cpf;
        document.getElementById('edit-cli-name').value = c.nome;
        
        // Data
        if(c.data_nascimento) {
            // Formato vindo do banco: YYYY-MM-DD (do método get_cliente_por_cpf)
            const [y, m, d] = c.data_nascimento.split('-');
            document.getElementById('edit-cli-dd').value = d;
            document.getElementById('edit-cli-mm').value = m;
            document.getElementById('edit-cli-yyyy').value = y;
        }

        // Telefones (Preenche os 2 primeiros slots)
        document.getElementById('edit-cli-phone1').value = '';
        document.getElementById('edit-cli-phone2').value = '';
        
        if(c.telefones && c.telefones[0]) {
            document.getElementById('edit-cli-phone1').value = c.telefones[0].numero;
            document.getElementById('edit-cli-type1').value = c.telefones[0].tipo;
        }
        if(c.telefones && c.telefones[1]) {
            document.getElementById('edit-cli-phone2').value = c.telefones[1].numero;
            document.getElementById('edit-cli-type2').value = c.telefones[1].tipo;
        }

        editOverlay.classList.remove('hidden');
    };

    document.getElementById('form-cli-edit').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const telefones = [];
        const t1 = document.getElementById('edit-cli-phone1').value;
        if(t1) telefones.push({ numero: t1, tipo: document.getElementById('edit-cli-type1').value });
        
        const t2 = document.getElementById('edit-cli-phone2').value;
        if(t2) telefones.push({ numero: t2, tipo: document.getElementById('edit-cli-type2').value });

        const dados = {
            cpf: currentCpfEdit, // Necessário para o backend achar quem atualizar
            nome: document.getElementById('edit-cli-name').value,
            data_nascimento: `${document.getElementById('edit-cli-dd').value}/${document.getElementById('edit-cli-mm').value}/${document.getElementById('edit-cli-yyyy').value}`,
            telefones: telefones
        };

        const res = await window.App.atualizarCliente(dados);
        if(res.ok) {
            showToast("Cliente atualizado!");
            editOverlay.classList.add('hidden');
            renderClients();
        } else {
            const err = await res.json();
            alert(err.erro || "Erro ao atualizar");
        }
    });
    
    document.getElementById('btn-cancel-cli-edit').addEventListener('click', () => editOverlay.classList.add('hidden'));


    // --- DELETAR ---
    const deleteOverlay = document.getElementById('overlay-delete');
    
    document.getElementById('btn-cli-delete-init').addEventListener('click', () => deleteOverlay.classList.remove('hidden'));
    document.getElementById('btn-cancel-delete').addEventListener('click', () => deleteOverlay.classList.add('hidden'));
    
    // Substitui botão de confirmar para remover listeners antigos (clone)
    const btnConfDel = document.getElementById('btn-confirm-delete');
    const newBtnConfDel = btnConfDel.cloneNode(true);
    btnConfDel.parentNode.replaceChild(newBtnConfDel, btnConfDel);

    newBtnConfDel.addEventListener('click', async () => {
        if(currentCpfEdit) {
            const res = await window.App.deletarCliente(currentCpfEdit);
            if(res.ok) {
                showToast("Cliente removido!");
                renderClients();
                deleteOverlay.classList.add('hidden');
                editOverlay.classList.add('hidden');
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao deletar");
            }
        }
    });

});