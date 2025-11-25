// frontend/scripts/funcionarios.js

document.addEventListener('DOMContentLoaded', () => {
    
    const empList = document.getElementById('employee-list');
    if (!empList) return;

    const { formatMoney, showToast } = window.App;
    
    // Variável para controlar qual CPF está sendo editado/excluído
    let currentCpfEdit = null;

    // --- RENDERIZAÇÃO (Listagem) ---
    const renderEmployees = async () => {
        empList.innerHTML = '<p style="text-align:center; padding:20px;">Carregando...</p>';

        // 1. Coleta dados dos filtros do HTML
        // Tratamento da data
        const dd = document.getElementById('filter-emp-dd')?.value;
        const mm = document.getElementById('filter-emp-mm')?.value;
        const yyyy = document.getElementById('filter-emp-yyyy')?.value;
        let dataBusca = "";
        if (dd && mm && yyyy) dataBusca = `${dd}/${mm}/${yyyy}`;
		
		// CORREÇÃO DA ORDENAÇÃO: Mapear valor do HTML para o Backend
        const sortEl = document.getElementById('sort-emp');
        let ordenacaoBackend = 'padrao';
        if (sortEl) {
            const val = sortEl.value; // "sales-desc" ou "salary-desc"
            if (val === 'sales-desc') ordenacaoBackend = 'vendas';
            if (val === 'salary-desc') ordenacaoBackend = 'salario';
        }

        const filtros = {
            nome: document.getElementById('filter-emp-name')?.value,
            cpf: document.getElementById('filter-emp-cpf')?.value,
            turno: document.getElementById('filter-emp-turno')?.value,
            cargo: document.getElementById('filter-emp-cargo')?.value,
            supervisor: document.getElementById('filter-emp-sup')?.value,
            ordenacao: ordenacaoBackend, // Envia o valor correto pro Python
            // Backend aceita 'min' e 'max', aqui estamos usando uma data exata no filtro visual,
            // mas podemos mandar como 'min' para buscar daquela data em diante ou adaptar o backend.
            // Vou mandar como 'min' para simplificar a busca por data específica:
            min: dataBusca 
        };

        try {
            // 2. Chama a API
            const funcionarios = await window.App.getFuncionarios(filtros);
            
            empList.innerHTML = '';

            if (funcionarios.length === 0) {
                empList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhum funcionário encontrado.</p>';
                return;
            }

            // 3. Renderiza o HTML
            funcionarios.forEach(e => {
                const row = document.createElement('div');
                row.className = 'stock-item-row';
                
                // Se o backend retornar total_vendas (dependendo da ordenação), mostramos
                const salesDisplay = e.total_vendas ? ` (${e.total_vendas} vendas)` : '';

                row.innerHTML = `
                    <div class="stock-field-group emp-col-name">
                        <label>Nome</label>
                        <input type="text" value="${e.nome}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group emp-col-cpf">
                        <label>CPF</label>
                        <input type="text" value="${e.cpf}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group emp-col-date">
                        <label>Nascimento</label>
                        <input type="text" value="${e.data_nascimento || '--'}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group emp-col-salary">
                        <label>Salário</label>
                        <div class="price-input-wrapper">
                            <span>R$</span>
                            <input type="text" value="${formatMoney(e.salario)}" class="stock-input-transparent" readonly>
                        </div>
                    </div>
                    <div class="stock-field-group emp-col-turno">
                        <label>Turno</label>
                        <input type="text" value="${e.turno || '-'}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group emp-col-cargo">
                        <label>Cargo</label>
                        <input type="text" value="${e.cargo || '-'}${salesDisplay}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group emp-col-sup">
                        <label>Supervisor</label>
                        <input type="text" value="${e.cpf_supervisor || '-'}" readonly class="stock-input">
                    </div>
                    <div class="emp-col-btn">
                        <button class="btn-edit-stock" onclick="openEditEmpModal('${e.cpf}')">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
                empList.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            empList.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar dados.</p>';
        }
    };

    // Listeners de Filtros e Ordenação
    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderEmployees);
    document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
        input.addEventListener('change', renderEmployees);
    });
    
    // Carregar inicial
    renderEmployees();


    // --- REGISTRO (CREATE) ---
    const btnOpenEmp = document.getElementById('btn-abrir-form-emp');
    const btnCancelEmp = document.getElementById('btn-cancel-emp-reg');
    const viewEmpDefault = document.getElementById('emp-default-view');
    const viewEmpForm = document.getElementById('emp-form-view');
    const formEmpReg = document.getElementById('form-emp-register');
    const btnConfirmEmp = document.getElementById('btn-confirm-emp-reg');

    // Alternar visualização
    if(btnOpenEmp) btnOpenEmp.addEventListener('click', () => { viewEmpDefault.classList.add('hidden'); viewEmpForm.classList.remove('hidden'); });
    if(btnCancelEmp) btnCancelEmp.addEventListener('click', () => { viewEmpForm.classList.add('hidden'); viewEmpDefault.classList.remove('hidden'); formEmpReg.reset(); });

    // Validação visual do botão
    const validateEmpForm = () => {
        const cpf = document.getElementById('reg-emp-cpf').value;
        const name = document.getElementById('reg-emp-name').value;
        const salary = document.getElementById('reg-emp-salary').value;
        const dd = document.getElementById('reg-emp-dd').value;
        const mm = document.getElementById('reg-emp-mm').value;
        const yyyy = document.getElementById('reg-emp-yyyy').value;
        
        if(btnConfirmEmp) btnConfirmEmp.disabled = !(cpf && name && salary && dd && mm && yyyy);
    };

    if(formEmpReg) {
        formEmpReg.addEventListener('input', validateEmpForm);
        
        formEmpReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dd = document.getElementById('reg-emp-dd').value;
            const mm = document.getElementById('reg-emp-mm').value;
            const yyyy = document.getElementById('reg-emp-yyyy').value;

            // Monta objeto JSON para o backend
            const novoFuncionario = {
                cpf: document.getElementById('reg-emp-cpf').value,
                nome: document.getElementById('reg-emp-name').value,
                salario: parseFloat(document.getElementById('reg-emp-salary').value),
                turno: document.getElementById('reg-emp-turno').value,
                cargo: document.getElementById('reg-emp-cargo').value,
                data_nascimento: `${dd}/${mm}/${yyyy}`, // Backend espera DD/MM/YYYY
                cpf_supervisor: document.getElementById('reg-emp-sup').value
            };

            const response = await window.App.criarFuncionario(novoFuncionario);

            if (response.ok) {
                showToast('Funcionário inserido com sucesso!');
                formEmpReg.reset();
                viewEmpForm.classList.add('hidden');
                viewEmpDefault.classList.remove('hidden');
                renderEmployees();
            } else {
                const err = await response.json();
                alert(err.erro || "Erro ao registrar funcionário");
            }
        });
    }
	
	// Botões de alternar tela de registro
    document.getElementById('btn-abrir-form-emp')?.addEventListener('click', () => {
        document.getElementById('emp-default-view').classList.add('hidden');
        document.getElementById('emp-form-view').classList.remove('hidden');
    });
    document.getElementById('btn-cancel-emp-reg')?.addEventListener('click', () => {
        document.getElementById('emp-form-view').classList.add('hidden');
        document.getElementById('emp-default-view').classList.remove('hidden');
    });

    // --- LÓGICA DE EDIÇÃO (CORRIGIDA) ---
    const editOverlayEmp = document.getElementById('overlay-emp-edit');
    
    // Definimos a função no window para o onclick do HTML encontrá-la
    window.openEditEmpModal = async (cpf) => {
        // Chama a API para pegar os dados completos
        const funcionario = await window.App.getFuncionarioPorCpf(cpf);
        
        if (!funcionario) {
            showToast("Erro ao buscar dados do funcionário.", "error");
            return;
        }

        currentCpfEdit = cpf;

        // Preenche o formulário
        document.getElementById('edit-emp-cpf').value = funcionario.cpf;
        document.getElementById('edit-emp-name').value = funcionario.nome;
        document.getElementById('edit-emp-salary').value = funcionario.salario;
        
        // Preenche selects (garante que o valor exista nas options)
        const turnoSelect = document.getElementById('edit-emp-turno');
        if (funcionario.turno) turnoSelect.value = funcionario.turno;
        
        const cargoSelect = document.getElementById('edit-emp-cargo');
        if (funcionario.cargo) cargoSelect.value = funcionario.cargo;

        document.getElementById('edit-emp-sup').value = funcionario.cpf_supervisor || "";

        // Data (vem como YYYY-MM-DD do backend)
        if (funcionario.data_nascimento) {
            const [y, m, d] = funcionario.data_nascimento.split('-');
            document.getElementById('edit-emp-dd').value = d;
            document.getElementById('edit-emp-mm').value = m;
            document.getElementById('edit-emp-yyyy').value = y;
        }

        editOverlayEmp.classList.remove('hidden');
    };

    // Fechar Modal
    document.getElementById('btn-cancel-emp-edit')?.addEventListener('click', () => {
        editOverlayEmp.classList.add('hidden');
    });

    // Salvar Edição
    const editFormEmp = document.getElementById('form-emp-edit');
    if(editFormEmp) {
        editFormEmp.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const dd = document.getElementById('edit-emp-dd').value;
            const mm = document.getElementById('edit-emp-mm').value;
            const yyyy = document.getElementById('edit-emp-yyyy').value;

            const dadosAtualizacao = {
                cpf: currentCpfEdit, // Necessário para o WHERE do SQL
                nome: document.getElementById('edit-emp-name').value,
                salario: document.getElementById('edit-emp-salary').value,
                turno: document.getElementById('edit-emp-turno').value,
                cargo: document.getElementById('edit-emp-cargo').value,
                data_nascimento: `${dd}/${mm}/${yyyy}`,
                cpf_supervisor: document.getElementById('edit-emp-sup').value
            };

            const res = await window.App.atualizarFuncionario(dadosAtualizacao);

            if(res.ok) {
                showToast('Funcionário atualizado!');
                editOverlayEmp.classList.add('hidden');
                renderEmployees(); // Recarrega a lista com a nova ordenação/dados
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao atualizar");
            }
        });
    }

    // --- DELETE ---
    const deleteOverlay = document.getElementById('overlay-delete');
    document.getElementById('btn-emp-delete-init')?.addEventListener('click', () => deleteOverlay.classList.remove('hidden'));
    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => deleteOverlay.classList.add('hidden'));

    // Hack para remover listeners antigos do botão Confirmar (se houver conflito com outras páginas)
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if(btnConfirmDelete) {
        const newBtn = btnConfirmDelete.cloneNode(true);
        btnConfirmDelete.parentNode.replaceChild(newBtn, btnConfirmDelete);
        
        newBtn.addEventListener('click', async () => {
            if(currentCpfEdit) {
                const res = await window.App.deletarFuncionario(currentCpfEdit);
                if(res.ok) {
                    showToast('Funcionário removido!');
                    deleteOverlay.classList.add('hidden');
                    editOverlayEmp.classList.add('hidden');
                    renderEmployees();
                } else {
                    const err = await res.json();
                    alert(err.erro || "Erro ao deletar");
                }
            }
        });
    }
});

