// js/funcionarios.js

document.addEventListener('DOMContentLoaded', () => {
    
    const empList = document.getElementById('employee-list');
    if (!empList) return;

    let employees = window.App.employees;
    const { formatMoney, showToast } = window.App;

    const renderEmployees = () => {
        empList.innerHTML = '';
        const nameFilter = document.getElementById('filter-emp-name')?.value.toLowerCase() || '';
        const cpfFilter = document.getElementById('filter-emp-cpf')?.value || '';
        // ... (filtros iguais) ...
        const turnoFilter = document.getElementById('filter-emp-turno')?.value || '';
        const cargoFilter = document.getElementById('filter-emp-cargo')?.value || '';
        const supFilter = document.getElementById('filter-emp-sup')?.value || '';
        const ddFilter = document.getElementById('filter-emp-dd')?.value || '';
        const mmFilter = document.getElementById('filter-emp-mm')?.value || '';
        const yyyyFilter = document.getElementById('filter-emp-yyyy')?.value || '';

        // NOVO: Ordenação
        const sortType = document.getElementById('sort-emp')?.value || 'default';

        let filtered = employees.filter(e => {
            const matchName = e.name.toLowerCase().includes(nameFilter);
            const matchCpf = e.cpf.includes(cpfFilter);
            const matchTurno = turnoFilter === '' || e.turno === turnoFilter;
            const matchCargo = cargoFilter === '' || e.cargo === cargoFilter;
            const matchSup = e.supervisor.includes(supFilter);
            let matchDate = true;
            const [d, m, y] = e.dob.split('/');
            if (ddFilter && d !== ddFilter) matchDate = false;
            if (mmFilter && m !== mmFilter) matchDate = false;
            if (yyyyFilter && y !== yyyyFilter) matchDate = false;
            return matchName && matchCpf && matchTurno && matchCargo && matchSup && matchDate;
        });

        // Lógica de Ordenação
        if (sortType === 'sales-desc') {
            filtered.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        } else if (sortType === 'salary-desc') {
            filtered.sort((a, b) => a.salary - b.salary);
        }

        filtered.forEach(e => {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            // Adicionei contador de vendas ao cargo para visualização
            const salesDisplay = e.salesCount ? ` (${e.salesCount} vendas)` : '';
            
            row.innerHTML = `
                <div class="stock-field-group emp-col-name"><label>Nome</label><input type="text" value="${e.name}" readonly class="stock-input"></div>
                <div class="stock-field-group emp-col-cpf"><label>CPF</label><input type="text" value="${e.cpf}" readonly class="stock-input"></div>
                <div class="stock-field-group emp-col-date"><label>Nascimento</label><input type="text" value="${e.dob}" readonly class="stock-input"></div>
                <div class="stock-field-group emp-col-salary"><label>Salário</label><div class="price-input-wrapper"><span>R$</span><input type="text" value="${formatMoney(e.salary)}" class="stock-input-transparent" readonly></div></div>
                <div class="stock-field-group emp-col-turno"><label>Turno</label><input type="text" value="${e.turno}" readonly class="stock-input"></div>
                <div class="stock-field-group emp-col-cargo"><label>Cargo</label><input type="text" value="${e.cargo}${salesDisplay}" readonly class="stock-input" title="Vendas realizadas"></div>
                <div class="stock-field-group emp-col-sup"><label>Supervisor</label><input type="text" value="${e.supervisor}" readonly class="stock-input"></div>
                <div class="emp-col-btn"><button class="btn-edit-stock" onclick="openEditEmpModal(${e.id})"><i class="fas fa-pen"></i></button></div>
            `;
            empList.appendChild(row);
        });
    };
    document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
        input.addEventListener('input', renderEmployees);
        input.addEventListener('change', renderEmployees);
    });
    renderEmployees();

    // --- Registro ---
    const btnOpenEmp = document.getElementById('btn-abrir-form-emp');
    const btnCancelEmp = document.getElementById('btn-cancel-emp-reg');
    const viewEmpDefault = document.getElementById('emp-default-view');
    const viewEmpForm = document.getElementById('emp-form-view');
    const formEmpReg = document.getElementById('form-emp-register');
    const btnConfirmEmp = document.getElementById('btn-confirm-emp-reg');

    if(btnOpenEmp) btnOpenEmp.addEventListener('click', () => { viewEmpDefault.classList.add('hidden'); viewEmpForm.classList.remove('hidden'); });
    if(btnCancelEmp) btnCancelEmp.addEventListener('click', () => { viewEmpForm.classList.add('hidden'); viewEmpDefault.classList.remove('hidden'); formEmpReg.reset(); });

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
        formEmpReg.addEventListener('change', validateEmpForm);
        formEmpReg.addEventListener('submit', (e) => {
            e.preventDefault();
            const dd = document.getElementById('reg-emp-dd').value;
            const mm = document.getElementById('reg-emp-mm').value;
            const yyyy = document.getElementById('reg-emp-yyyy').value;
            
            employees.push({
                id: Date.now(),
                cpf: document.getElementById('reg-emp-cpf').value,
                name: document.getElementById('reg-emp-name').value,
                salary: parseFloat(document.getElementById('reg-emp-salary').value),
                turno: document.getElementById('reg-emp-turno').value,
                cargo: document.getElementById('reg-emp-cargo').value,
                dob: `${dd}/${mm}/${yyyy}`,
                supervisor: document.getElementById('reg-emp-sup').value || '-'
            });
            window.App.saveEmployees(); // CORREÇÃO: Chamada direta
            renderEmployees();
            showToast('Funcionário inserido com sucesso!');
            formEmpReg.reset();
            viewEmpForm.classList.add('hidden');
            viewEmpDefault.classList.remove('hidden');
        });
    }

    // --- Edição e Delete ---
    const editOverlayEmp = document.getElementById('overlay-emp-edit');
    const editFormEmp = document.getElementById('form-emp-edit');
    let currentEmpId = null;

    window.openEditEmpModal = (id) => {
        const e = employees.find(x => x.id === id);
        if(!e) return;
        currentEmpId = id;
        document.getElementById('edit-emp-cpf').value = e.cpf;
        document.getElementById('edit-emp-name').value = e.name;
        document.getElementById('edit-emp-salary').value = e.salary;
        document.getElementById('edit-emp-turno').value = e.turno;
        document.getElementById('edit-emp-cargo').value = e.cargo;
        document.getElementById('edit-emp-sup').value = e.supervisor;
        const [d, m, y] = e.dob.split('/');
        document.getElementById('edit-emp-dd').value = d;
        document.getElementById('edit-emp-mm').value = m;
        document.getElementById('edit-emp-yyyy').value = y;
        editOverlayEmp.classList.remove('hidden');
    };

    document.getElementById('btn-cancel-emp-edit').addEventListener('click', () => editOverlayEmp.classList.add('hidden'));

    editFormEmp?.addEventListener('submit', (e) => {
        e.preventDefault();
        const idx = employees.findIndex(x => x.id === currentEmpId);
        if (idx > -1) {
            const d = document.getElementById('edit-emp-dd').value;
            const m = document.getElementById('edit-emp-mm').value;
            const y = document.getElementById('edit-emp-yyyy').value;
            employees[idx].name = document.getElementById('edit-emp-name').value;
            employees[idx].salary = parseFloat(document.getElementById('edit-emp-salary').value);
            employees[idx].turno = document.getElementById('edit-emp-turno').value;
            employees[idx].cargo = document.getElementById('edit-emp-cargo').value;
            employees[idx].supervisor = document.getElementById('edit-emp-sup').value;
            employees[idx].dob = `${d}/${m}/${y}`;
            window.App.saveEmployees(); // CORREÇÃO: Chamada direta
            renderEmployees();
            showToast('Funcionário editado com sucesso!');
            editOverlayEmp.classList.add('hidden');
        }
    });

    const btnDeleteInit = document.getElementById('btn-emp-delete-init');
    const deleteOverlay = document.getElementById('overlay-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    
    btnDeleteInit?.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    btnConfirmDelete.addEventListener('click', () => {
        const idx = employees.findIndex(e => e.id === currentEmpId);
        if(idx > -1) {
            employees.splice(idx, 1);
            window.App.saveEmployees(); // CORREÇÃO: Chamada direta
            renderEmployees();
            showToast('Funcionário removido com sucesso!');
            document.getElementById('overlay-emp-edit').classList.add('hidden');
            deleteOverlay.classList.add('hidden');
        }
    });

    btnCancelDelete.addEventListener('click', () => deleteOverlay.classList.add('hidden'));
});