// scripts/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Lógica de Login (Autenticação) ---
    const loginForm = document.querySelector('.login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Tenta pegar o input por ID ou name (garantindo compatibilidade)
            const cpfInput = document.getElementById('cpf-login') || 
                             document.querySelector('input[name="cpf"]') ||
                             document.getElementById('cpf');
            
            if (!cpfInput || !cpfInput.value) {
                alert('Por favor, insira seu CPF.');
                return;
            }

            const cpf = cpfInput.value.trim();

            // Chama a API via shared.js
            // O método window.App.login já exibe alertas de erro se falhar
            const sucesso = await window.App.login(cpf);

            if (sucesso) {
                // Redireciona apenas se o backend confirmar o login
                window.location.href = 'caixa.html';
            }
        });
    }

    // --- 2. Alternância de Telas (Login <-> Registro) ---
    const btnReg = document.getElementById('btn-ir-registro');
    const btnCancel = document.getElementById('btn-cancelar');
    const mainPanel = document.getElementById('main-panel');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    if (btnReg) {
        btnReg.addEventListener('click', () => {
            if (loginView) loginView.classList.add('hidden');
            if (registerView) registerView.classList.remove('hidden');
            if (mainPanel) mainPanel.classList.add('mode-register');
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            if (registerView) registerView.classList.add('hidden');
            if (loginView) loginView.classList.remove('hidden');
            if (mainPanel) mainPanel.classList.remove('mode-register');
        });
    }

    // --- 3. Lógica de Registro (Criar Funcionário) ---
    const regForm = document.querySelector('.register-form');
    
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Seleciona todos os inputs e selects na ordem que aparecem no HTML
            const inputs = regForm.querySelectorAll('input, select');

            // Mapeamento baseado na ordem do index.html atual:
            // 0: CPF, 1: Nome, 2: Salário, 3: Turno, 4: Cargo, 
            // 5: Dia, 6: Mês, 7: Ano, 8: CPF Supervisor
            
            const cpf = inputs[0].value;
            const nome = inputs[1].value;
            const salario = parseFloat(inputs[2].value);
            const turno = inputs[3].value;
            const cargo = inputs[4].value;
            
            const dia = inputs[5].value;
            const mes = inputs[6].value;
            const ano = inputs[7].value;
            
            const supervisor = inputs[8].value || null; // Pode ser vazio

            // Validação básica
            if (!cpf || !nome || !salario || !dia || !mes || !ano) {
                alert("Preencha todos os campos obrigatórios.");
                return;
            }

            // Monta o objeto conforme esperado pelo backend (rotas/funcionarios.py)
            // CORREÇÃO AQUI: A chave deve ser 'cpf' e não 'cpf_funcionario' para a rota de criação
            const novoFuncionario = {
                cpf: cpf, 
                nome: nome,
                salario: salario,
                turno: turno,
                cargo: cargo,
                data_nascimento: `${dia}/${mes}/${ano}`, // DD/MM/YYYY
                cpf_supervisor: supervisor
            };

            try {
                // Chama a API para criar
                const response = await window.App.criarFuncionario(novoFuncionario);
                
                if (response && response.ok) {
                    alert("Funcionário registrado com sucesso!");
                    
                    // Tenta fazer login automático após registro
                    const loginSucesso = await window.App.login(cpf);
                    if (loginSucesso) {
                        window.location.href = 'caixa.html';
                    }
                } else {
                    // Se a API retornou erro (ex: CPF duplicado), o shared.js ou aqui captura
                    // (O apiRequest no shared.js geralmente não lança erro em 400/500, mas retorna response)
                    const err = await response.json();
                    alert("Erro ao registrar: " + (err.erro || "Dados inválidos"));
                }
            } catch (error) {
                console.error("Erro técnico:", error);
                alert("Erro de conexão ao registrar.");
            }
        });
    }
});