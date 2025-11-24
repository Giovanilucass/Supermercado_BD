// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    const executaLogin = (cpf) => {
        if(cpf) {
            localStorage.setItem('funcionario_cpf', cpf);
            window.location.href = 'caixa.html';
        } else {
            alert('Por favor, insira um CPF válido.');
        }
    };

    // 1. Formulário de Login Padrão
    const loginForm = document.querySelector('.login-form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const cpfInput = document.getElementById('cpf-login') || document.getElementById('cpf');
            executaLogin(cpfInput.value);
        });
    }

    // 2. Botão "Registrar Novo Funcionário" (Alterna telas)
    const btnReg = document.getElementById('btn-ir-registro');
    const btnCancel = document.getElementById('btn-cancelar');
    const mainPanel = document.getElementById('main-panel');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    if(btnReg) {
        btnReg.addEventListener('click', () => {
            if(loginView) loginView.classList.add('hidden');
            if(registerView) registerView.classList.remove('hidden');
            if(mainPanel) mainPanel.classList.add('mode-register');
        });
    }

    if(btnCancel) {
        btnCancel.addEventListener('click', () => {
            if(registerView) registerView.classList.add('hidden');
            if(loginView) loginView.classList.remove('hidden');
            if(mainPanel) mainPanel.classList.remove('mode-register');
        });
    }

    // 3. Submit do Formulário de Registro (Login Automático)
    const regFormIndex = document.querySelector('.register-form');
    if(regFormIndex) {
        regFormIndex.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = regFormIndex.querySelector('input');
            if(input && input.value) executaLogin(input.value);
        });
    }
});