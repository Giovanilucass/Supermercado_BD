// scripts/shared.js

document.addEventListener('DOMContentLoaded', () => {
    const headerElement = document.querySelector('.header');
    const userCpf = localStorage.getItem('funcionario_cpf');
    const path = window.location.pathname;

    // Login Guard
    const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/');
    
    if (!isLoginPage && !userCpf) {
        window.location.href = 'index.html';
        return;
    }

    if (headerElement) {
        fetch('components/header.html')
            .then(r => r.text())
            .then(html => {
                headerElement.innerHTML = html;
                const links = headerElement.querySelectorAll('.nav-link');
                if (!userCpf) {
                    links.forEach(l => { l.style.pointerEvents = 'none'; l.style.opacity = '0.5'; l.href = '#'; });
                } else {
                    links.forEach(l => {
                        l.classList.remove('active');
                        if (path.includes('estoque.html') && !path.includes('reestoque.html') && l.innerText === 'ESTOQUE') {
                            l.classList.add('active');
                        }
                        if (path.includes('caixa.html') && l.innerText === 'CAIXA') l.classList.add('active');
                        if (path.includes('funcionarios.html') && l.innerText === 'FUNCIONÁRIOS') l.classList.add('active');
                        if (path.includes('fluxo.html') && l.innerText === 'FLUXO') l.classList.add('active');
                        if (path.includes('clientes.html') && l.innerText === 'CLIENTES') l.classList.add('active');
                        if (path.includes('fornecedores.html') && l.innerText === 'FORNECEDORES') l.classList.add('active');
                        if (path.includes('reestoque.html') && l.innerText === 'REESTOCAR') l.classList.add('active');
                    });
                }
            });
    }
});

// --- DADOS E FUNÇÕES GLOBAIS ---

const loadData = (key, defaultData) => {
    try {
        const data = localStorage.getItem(key);
        if (!data || data === "undefined") return defaultData;
        return JSON.parse(data);
    } catch (e) {
        console.error(`Erro ao carregar dados de ${key}`, e);
        return defaultData;
    }
};

const saveData = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Erro ao salvar dados", e);
        alert("Erro ao salvar. Armazenamento cheio?");
    }
};

// DADOS PADRÃO
const defaultProducts = [
    { id: 1, code: '123', name: 'Biscoito Bauducco', price: 5.00, category: 'Alimento', promo: 0, ending: false, qtd: 50 },
    { id: 2, code: '456', name: 'Detergente Ypê', price: 2.50, category: 'Limpeza', promo: 10, ending: true, qtd: 5 },
    { id: 3, code: '789', name: 'Coca-Cola 2L', price: 8.00, category: 'Alimento', promo: 0, ending: false, qtd: 30 }
];

const defaultClients = [
    { id: 1, cpf: '111.222.333-44', name: 'Romário Fenômeno', dob: '29/01/1966', phone1: '(21) 99999-1000', type1: 'Celular' },
    { id: 2, cpf: '000.000.000-00', name: 'Cliente Teste', dob: '01/01/1990', phone1: '(11) 3333-4444', type1: 'Residencial' }
];

const defaultEmployees = [
    { id: 1, cpf: '123.456.789-00', name: 'Fábio Júnior', salary: 2500.00, turno: 'Matutino', cargo: 'Gerente', dob: '10/05/1980', supervisor: '-' },
    { id: 2, cpf: '987.654.321-11', name: 'Ana Maria', salary: 1400.00, turno: 'Vespertino', cargo: 'Caixa', dob: '22/08/1995', supervisor: '123.456.789-00' }
];

const defaultSuppliers = [
    { id: 1, cnpj: '12.345.678/0001-90', name: 'Fábricas Bauducco', email: 'contato@bauducco.com.br' },
    { id: 2, cnpj: '98.765.432/0001-00', name: 'Ypê Distribuidora', email: 'vendas@ype.com.br' }
];

// NOVO: Dados de Compras (Reestoque)
const defaultPurchases = [
    { 
        id: 1, nf: '4440001', date: '2025-11-19', time: '10:30:00', 
        supplierName: 'Fábricas Bauducco', supplierCnpj: '12.345.678/0001-90',
        productName: 'Biscoito Bauducco', productId: 1,
        qtd: 100, total: 500.00 
    }
];

window.App = {
    products: loadData('db_products', defaultProducts),
    clients: loadData('db_clients', defaultClients),
    employees: loadData('db_employees', defaultEmployees),
    suppliers: loadData('db_suppliers', defaultSuppliers),
    purchases: loadData('db_purchases', defaultPurchases), // NOVO

    saveProducts: () => saveData('db_products', window.App.products),
    saveClients: () => saveData('db_clients', window.App.clients),
    saveEmployees: () => saveData('db_employees', window.App.employees),
    saveSuppliers: () => saveData('db_suppliers', window.App.suppliers),
    savePurchases: () => saveData('db_purchases', window.App.purchases), // NOVO

    formatMoney: (val) => {
        if (val === undefined || val === null) return "0,00";
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    
    generateCode: () => {
        const p1 = Math.floor(Math.random() * 9) + 1;
        const p2 = Math.floor(Math.random() * 900000) + 100000;
        const p3 = Math.floor(Math.random() * 900000) + 100000;
        return `${p1} ${p2} ${p3}`;
    },

    showToast: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    resetSystem: () => {
        localStorage.clear();
        location.reload();
    }
};

// Migration IDs
['clients', 'suppliers', 'purchases'].forEach(key => {
    if (window.App[key]) {
        window.App[key].forEach((item, i) => { if (!item.id) item.id = Date.now() + i; });
        if(key === 'clients') window.App.saveClients();
        if(key === 'suppliers') window.App.saveSuppliers();
        if(key === 'purchases') window.App.savePurchases();
    }
});