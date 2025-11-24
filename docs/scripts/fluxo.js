// scripts/fluxo.js

document.addEventListener('DOMContentLoaded', () => {

    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return; // Segurança

    // Referências Globais (Utils)
    const { formatMoney, showToast } = window.App;

    // --- 1. GERAÇÃO DE DADOS (MOCK) ---
    // Vamos simular um histórico de transações misturando Vendas (Entrada) e Compras (Saída)
    
    const transactions = [
        { 
            id: 1, type: 'in', date: '2025-11-19 10:30:00', nf: '4444000000001', 
            origin: 'Venda ao Cliente', value: 100.00, payment: 'Cartão de Crédito',
            items: 'PRODUTO A (x2) - R$ 50,00\nPRODUTO B (x2) - R$ 50,00'
        },
        { 
            id: 2, type: 'out', date: '2025-11-18 14:20:00', nf: '5555000000002', 
            origin: 'BALDUCO LTDA', cnpj: '12.345.678/0001-90', email: 'contato@balduco.com', phone: '(11) 95555-1234',
            value: 50.00, 
            items: 'BISCOITO (cx) - R$ 50,00'
        },
        { 
            id: 3, type: 'in', date: '2025-11-19 11:00:00', nf: '4444000000003', 
            origin: 'Venda ao Cliente', value: 25.00, payment: 'Dinheiro',
            items: 'COCA COLA (x1) - R$ 8,00\nDETERGENTE (x2) - R$ 17,00'
        },
        { 
            id: 4, type: 'out', date: '2025-11-15 09:00:00', nf: '5555000000004', 
            origin: 'YPE LIMPEZA', cnpj: '98.765.432/0001-10', email: 'vendas@ype.com', phone: '(11) 98888-5678',
            value: 200.00, 
            items: 'DETERGENTE (cx grande) - R$ 200,00'
        },
        { 
            id: 5, type: 'in', date: '2025-11-19 12:45:00', nf: '4444000000005', 
            origin: 'Venda ao Cliente', value: 10.00, payment: 'Pix',
            items: 'BISCOITO (x2) - R$ 10,00'
        }
    ];

    // --- 2. CÁLCULO DO DASHBOARD ---
    const updateDashboard = () => {
        let totalIn = 0;
        let totalOut = 0;

        transactions.forEach(t => {
            if (t.type === 'in') totalIn += t.value;
            else totalOut += t.value;
        });

        const profit = totalIn - totalOut;

        document.getElementById('dash-total-in').innerText = `R$ ${formatMoney(totalIn)}`;
        document.getElementById('dash-total-out').innerText = `R$ ${formatMoney(totalOut)}`;
        document.getElementById('dash-profit').innerText = `R$ ${formatMoney(profit)}`;
    };

    // --- 3. RENDERIZAÇÃO DA LISTA ---
    const renderList = () => {
        listContainer.innerHTML = '';

        // Filtros
        const nfFilter = document.getElementById('filter-nf').value.trim();
        const minVal = parseFloat(document.getElementById('filter-val-min').value) || 0;
        const maxVal = document.getElementById('filter-val-max').value ? parseFloat(document.getElementById('filter-val-max').value) : Infinity;
        const minDate = document.getElementById('filter-date-min').value; // String simples por enquanto
        const maxDate = document.getElementById('filter-date-max').value;

        const filtered = transactions.filter(t => {
            const matchNF = t.nf.includes(nfFilter);
            const matchVal = t.value >= minVal && t.value <= maxVal;
            
            // Filtro de data simplificado (string match para demo, idealmente parse Date)
            let matchDate = true;
            const dateOnly = t.date.split(' ')[0]; // Pega só YYYY-MM-DD ou formato que estiver
            // Para converter input DD/MM/YYYY para comparação real, seria necessário função extra
            // Aqui faremos checagem simples se o usuário digitou algo exato
            if(minDate && !t.date.includes(minDate)) matchDate = false; 

            return matchNF && matchVal && matchDate;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma transação encontrada.</p>';
            if (nfFilter || minVal > 0) showToast('Não há valores para os filtros selecionados', 'error');
            return;
        }

        filtered.forEach(t => {
            const isEntry = t.type === 'in';
            const dotClass = isEntry ? 'dot-green' : 'dot-red';
            const valClass = isEntry ? 'val-green' : 'val-red';
            const sign = isEntry ? '+ ' : '- ';

            const row = document.createElement('div');
            row.className = 'fluxo-item-row';
            row.innerHTML = `
                <div class="col-type"><span class="indicator-dot ${dotClass}"></span></div>
                <div class="col-date">${t.date}</div>
                <div class="col-nf">${t.nf}</div>
                <div class="col-origin">${t.origin}</div>
                <div class="col-value ${valClass}">${sign}R$ ${formatMoney(t.value)}</div>
                <div class="col-details">
                    <button class="btn-details" onclick="openDetails(${t.id})"><i class="fas fa-eye"></i></button>
                </div>
            `;
            listContainer.appendChild(row);
        });
    };

    // --- 4. MODAL DE DETALHES ---
    const detailsOverlay = document.getElementById('overlay-details');
    const btnClose = document.getElementById('btn-close-details');

    // Função Global para onclick
    window.openDetails = (id) => {
        const t = transactions.find(x => x.id === id);
        if(!t) return;

        const isEntry = t.type === 'in';

        // Título
        document.getElementById('modal-title').innerText = isEntry ? 
            'DETALHES DA TRANSAÇÃO (ENTRADA)' : 'DETALHES DA TRANSAÇÃO (SAÍDA)';

        // Campos Comuns
        document.getElementById('det-nf').value = t.nf;
        document.getElementById('det-date').value = t.date;
        document.getElementById('det-total-value').innerText = `R$ ${formatMoney(t.value)}`;
        document.getElementById('det-items').value = t.items;

        // Lógica de Campos Específicos
        const rowPayment = document.getElementById('row-payment');
        const labelOrigin = document.getElementById('label-origin-type');
        const supplierFields = document.getElementById('supplier-extra-fields');

        if (isEntry) {
            // Configuração de Entrada
            rowPayment.classList.remove('hidden');
            document.getElementById('det-payment').value = t.payment;
            
            labelOrigin.innerText = 'ORIGEM';
            document.getElementById('det-origin-name').value = t.origin;
            
            supplierFields.classList.add('hidden');
        } else {
            // Configuração de Saída
            rowPayment.classList.add('hidden');
            
            labelOrigin.innerText = 'ORIGEM (FORNECEDOR)';
            document.getElementById('det-origin-name').value = t.origin;
            
            // Preenche extras
            supplierFields.classList.remove('hidden');
            document.getElementById('det-cnpj').value = t.cnpj || '';
            document.getElementById('det-email').value = t.email || '';
            document.getElementById('det-phone').value = t.phone || '';
        }

        detailsOverlay.classList.remove('hidden');
    };

    btnClose.addEventListener('click', () => {
        detailsOverlay.classList.add('hidden');
    });

    // --- 5. EVENTOS DE FILTRO ---
    document.getElementById('btn-filter-fluxo').addEventListener('click', renderList);
    
    // Inicialização
    updateDashboard();
    renderList();

});