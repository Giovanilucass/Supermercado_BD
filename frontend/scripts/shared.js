// scripts/shared.js

document.addEventListener('DOMContentLoaded', () => {

    const userCpf = localStorage.getItem('funcionario_cpf');
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/');

    if (!isLoginPage && !userCpf) {
        window.location.href = 'index.html';
        return;
    }

    // Carregamento do Header
    const headerElement = document.querySelector('.header');
    if (headerElement) {
        fetch('components/header.html')
            .then(r => r.text())
            .then(html => {
                headerElement.innerHTML = html;
                const links = headerElement.querySelectorAll('.nav-link');
                
                // Define link ativo
                links.forEach(l => {
                    l.classList.remove('active');
                    if (path.includes('estoque.html') && !path.includes('reestoque.html') && l.innerText === 'ESTOQUE') l.classList.add('active');
                    if (path.includes('caixa.html') && l.innerText === 'CAIXA') l.classList.add('active');
                    if (path.includes('funcionarios.html') && l.innerText === 'FUNCIONÁRIOS') l.classList.add('active');
                    if (path.includes('fluxo.html') && l.innerText === 'FLUXO') l.classList.add('active');
                    if (path.includes('clientes.html') && l.innerText === 'CLIENTES') l.classList.add('active');
                    if (path.includes('fornecedores.html') && l.innerText === 'FORNECEDORES') l.classList.add('active');
                    if (path.includes('reestoque.html') && l.innerText === 'REESTOCAR') l.classList.add('active');
                });
            })
            .catch(err => console.error("Erro ao carregar header:", err));
    }
});

// --- CONFIGURAÇÃO DA API ---

const API_BASE_URL = "http://127.0.0.1:8000";

// Função auxiliar para converter data HTML (YYYY-MM-DD) para Backend (DD/MM/YYYY)
function formatDateToBack(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

/**
 * Função genérica para chamadas à API
 * @param {string} endpoint - Ex: "/produtos"
 * @param {string} method - "GET", "POST", "PUT", "DELETE"
 * @param {object} body - Dados para enviar (opcional)
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // IMPORTANTE: Permite enviar cookies de sessão do Flask
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Tratamento de erro de autenticação (Sessão expirada)
        if (response.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            localStorage.removeItem('funcionario_cpf');
            window.location.href = 'index.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        window.App.showToast("Erro de conexão com o servidor", "error");
        throw error;
    }
}

// --- OBJETO GLOBAL APP (Substitui os dados locais por métodos da API) ---

window.App = {
    
    // Utilitários Visuais
    formatMoney: (val) => {
        if (val === undefined || val === null) return "0,00";
        // Garante que é número antes de formatar
        const num = parseFloat(val);
        return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    showToast: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    // --- MÉTODOS DA API ---

    // Autenticação
    login: async (cpf) => {
        const res = await apiRequest('/login', 'POST', { cpf_funcionario: cpf });
        if (res.ok) {
            localStorage.setItem('funcionario_cpf', cpf);
            return true;
        } else {
            const err = await res.json();
            alert(err.erro || "Erro ao fazer login");
            return false;
        }
    },

    // --- PRODUTOS (Foco da correção) ---

    getProdutos: async (filtros = {}) => {
        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/produtos?${query}`, 'GET');
        return res.ok ? await res.json() : [];
    },

    // Busca dados para o Modal de Edição
    getProdutoPorCodigo: async (codigo) => {
        // Rota no backend: @produtos_blueprint.route("/produtos/<int:codigo>")
        const res = await apiRequest(`/produtos/${codigo}`, 'GET');
        return res.ok ? await res.json() : null;
    },

    criarProduto: async (dados) => {
        return await apiRequest('/produtos', 'POST', dados);
    },

    atualizarProduto: async (codigo, dados) => {
        // Rota no backend: PUT /produtos/<int:codigo>
        return await apiRequest(`/produtos/${codigo}`, 'PUT', dados);
    },

    deletarProduto: async (codigo) => {
        // Rota no backend: DELETE /produtos/<int:codigo>
        return await apiRequest(`/produtos/${codigo}`, 'DELETE');
    },

    // Clientes
    getClientes: async (filtros = {}) => {
        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/clientes?${query}`, 'GET');
        return res.ok ? await res.json() : [];
    },
    criarCliente: async (dados) => {
        return await apiRequest('/clientes', 'POST', dados);
    },
    atualizarCliente: async (dados) => {
        return await apiRequest('/clientes', 'PUT', dados);
    },
    deletarCliente: async (cpf) => {
        return await apiRequest('/clientes', 'DELETE', { cpf: cpf });
    },

    // --- FUNCIONÁRIOS (Correções aqui) ---
	
	// --- FUNCIONÁRIOS (INTEGRAÇÃO NOVA) ---
    getFuncionarios: async (filtros = {}) => {
        // Converte objeto { nome: '...', turno: '...' } para query string
        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/funcionarios?${query}`, 'GET');
        return res.ok ? await res.json() : [];
    },
    
    // Busca dados completos de um único funcionário para edição
    getFuncionarioPorCpf: async (cpf) => {
        const res = await apiRequest(`/funcionarios/consultar?cpf=${cpf}`, 'GET');
        return res.ok ? await res.json() : null;
    },

    criarFuncionario: async (dados) => {
        return await apiRequest('/funcionarios', 'POST', dados);
    },

    atualizarFuncionario: async (dados) => {
        // O backend espera um PUT com json contendo o 'cpf' original
        return await apiRequest('/funcionarios', 'PUT', dados);
    },

    deletarFuncionario: async (cpf) => {
        return await apiRequest('/funcionarios', 'DELETE', { cpf: cpf });
    },
	
	// --- FLUXO (FINANCEIRO) ---
    
    getFluxo: async (filtros = {}) => {
        // O Backend espera datas no formato DD/MM/YYYY
        // Se vier YYYY-MM-DD do input type="date", convertemos
        if (filtros.min && filtros.min.includes('-')) {
            const [y, m, d] = filtros.min.split('-');
            filtros.min = `${d}/${m}/${y}`;
        }
        if (filtros.max && filtros.max.includes('-')) {
            const [y, m, d] = filtros.max.split('-');
            filtros.max = `${d}/${m}/${y}`;
        }

        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/fluxo?${query}`, 'GET');
        
        // O Backend retorna { lista: [], resumo: { total_entradas, total_saidas, lucro } }
        return res.ok ? await res.json() : { lista: [], resumo: { total_entradas:0, total_saidas:0, lucro:0 } };
    },

    getDetalhesFluxo: async (nf, tipo) => {
        // Rota: /fluxo/detalhes/<nf>?tipo=E (ou S)
        const res = await apiRequest(`/fluxo/detalhes/${nf}?tipo=${tipo}`, 'GET');
        return res.ok ? await res.json() : null;
    },

    // --- FORNECEDORES (INTEGRAÇÃO) ---
    getFornecedores: async (filtros = {}) => {
        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/fornecedores?${query}`, 'GET');
        return res.ok ? await res.json() : [];
    },

    // Busca dados para o Modal de Edição
    getFornecedorPorCnpj: async (cnpj) => {
        // Rota: GET /fornecedores/consultar?cnpj=...
        const res = await apiRequest(`/fornecedores/consultar?cnpj=${cnpj}`, 'GET');
        return res.ok ? await res.json() : null;
    },

    // Busca produtos para o Modal "Olho"
    getProdutosFornecedor: async (cnpj) => {
        // Rota: GET /fornecedores/produtos?cnpj=...
        const res = await apiRequest(`/fornecedores/produtos?cnpj=${cnpj}`, 'GET');
        return res.ok ? await res.json() : [];
    },

    criarFornecedor: async (dados) => {
        return await apiRequest('/fornecedores', 'POST', dados);
    },

    atualizarFornecedor: async (dados) => {
        return await apiRequest('/fornecedores', 'PUT', dados);
    },

    deletarFornecedor: async (cnpj) => {
        return await apiRequest('/fornecedores', 'DELETE', { cnpj: cnpj });
    },

    // Caixa (Operações Stateful no Backend)
    getCaixa: async () => {
        const res = await apiRequest('/caixa', 'GET');
        return res.ok ? await res.json() : { Produtos: [], Total: "0.00" };
    },
    adicionarAoCaixa: async (codigo) => {
        return await apiRequest('/caixa', 'POST', { codigo: codigo });
    },
    removerDoCaixa: async (codigo) => {
        return await apiRequest(`/caixa/${codigo}`, 'DELETE');
    },
    atualizarQtdCaixa: async (codigo, acao) => {
        // acao: "aumentar" ou "diminuir"
        return await apiRequest(`/caixa/${codigo}`, 'PATCH', { acao: acao });
    },
    limparCaixa: async () => {
        return await apiRequest('/caixa', 'DELETE');
    },
    confirmarVenda: async (dadosPagamento) => {
        return await apiRequest('/caixa/confirmar', 'POST', dadosPagamento);
    },
	
	// --- REESTOQUE (NOVOS MÉTODOS) ---

    getReestoque: async (filtros = {}) => {
        // Tratamento de datas para os filtros
        if (filtros.data_min) filtros.data_min = formatDateToBack(filtros.data_min);
        if (filtros.data_max) filtros.data_max = formatDateToBack(filtros.data_max);

        const query = new URLSearchParams(filtros).toString();
        const res = await apiRequest(`/reestoque?${query}`, 'GET');
        return res.ok ? await res.json() : [];
    },

    criarEntradaEstoque: async (dados) => {
        // Garante formato de data
        if (dados.data) dados.data = formatDateToBack(dados.data);
        return await apiRequest('/reestoque', 'POST', dados);
    },

    atualizarEntradaEstoque: async (nf, dados) => {
        if (dados.data) dados.data = formatDateToBack(dados.data);
        return await apiRequest(`/reestoque/${nf}`, 'PUT', dados);
    },

    deletarEntradaEstoque: async (nf) => {
        return await apiRequest(`/reestoque/${nf}`, 'DELETE');
    }
};