// frontend/scripts/fluxo.js

document.addEventListener('DOMContentLoaded', () => {

    const listContainer = document.getElementById('transaction-list');
    if (!listContainer) return;

    const { formatMoney, showToast } = window.App;

    // --- RENDERIZAÇÃO (Dashboard + Lista) ---
    const renderFluxo = async () => {
        listContainer.innerHTML = '<p style="text-align:center; padding:20px;">Carregando fluxo...</p>';

        // 1. Coleta Filtros
        const nfFilter = document.getElementById('filter-nf').value.trim();
        const valMin = document.getElementById('filter-val-min').value;
        const valMax = document.getElementById('filter-val-max').value;
        const dateMin = document.getElementById('filter-date-min').value; // Input date (YYYY-MM-DD)
        const dateMax = document.getElementById('filter-date-max').value; // Input date (YYYY-MM-DD)

        const filtros = {
            nf: nfFilter,
            valor_min: valMin,
            valor_max: valMax,
            min: dateMin,
            max: dateMax
        };

        try {
            // 2. Chama API
            const dados = await window.App.getFluxo(filtros);
            // Resposta esperada: { lista: [...], resumo: { total_entradas, total_saidas, lucro } }

            // 3. Atualiza Dashboard (Cards)
            updateDashboard(dados.resumo);

            // 4. Renderiza Lista
            listContainer.innerHTML = '';

            if (!dados.lista || dados.lista.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma transação encontrada.</p>';
                return;
            }

            dados.lista.forEach(t => {
                // Mapeamento de Tipos do Backend ('E' ou 'S') para Classes CSS
                const isEntry = t.tipo === 'E';
                const dotClass = isEntry ? 'dot-green' : 'dot-red';
                const valClass = isEntry ? 'val-green' : 'val-red';
                const sign = isEntry ? '+ ' : '- ';

                const row = document.createElement('div');
                row.className = 'fluxo-item-row';
                row.innerHTML = `
                    <div class="col-type"><span class="indicator-dot ${dotClass}"></span></div>
                    <div class="col-date">${t.data_hora}</div>
                    <div class="col-nf">${t.nf}</div>
                    <div class="col-origin">${t.origem || '-'}</div>
                    <div class="col-value ${valClass}">${sign}R$ ${formatMoney(t.valor)}</div>
                    <div class="col-details">
                        <button class="btn-details" onclick="window.openDetails('${t.nf}', '${t.tipo}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
                listContainer.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            listContainer.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar fluxo.</p>';
        }
    };

    const updateDashboard = (resumo) => {
        if (!resumo) return;

        document.getElementById('dash-total-in').innerText = `R$ ${formatMoney(resumo.total_entradas)}`;
        document.getElementById('dash-total-out').innerText = `R$ ${formatMoney(resumo.total_saidas)}`;
        
        const lucroEl = document.getElementById('dash-profit');
        lucroEl.innerText = `R$ ${formatMoney(resumo.lucro)}`;

        // Cor do lucro
        if (resumo.lucro < 0) {
            lucroEl.parentElement.classList.remove('green');
            lucroEl.parentElement.classList.add('red');
        } else {
            lucroEl.parentElement.classList.remove('red');
            lucroEl.parentElement.classList.add('green');
        }
    };

    // --- MODAL DE DETALHES ---
    const detailsOverlay = document.getElementById('overlay-details');
    const btnClose = document.getElementById('btn-close-details');

    window.openDetails = async (nf, tipo) => {
        const detalhe = await window.App.getDetalhesFluxo(nf, tipo);
        
        if (!detalhe) {
            showToast("Detalhes não encontrados", "error");
            return;
        }

        const isEntry = tipo === 'E';

        // Título
        document.getElementById('modal-title').innerText = isEntry ? 
            'DETALHES DA VENDA (ENTRADA)' : 'DETALHES DA COMPRA (SAÍDA)';

        // Preenche Campos
        document.getElementById('det-nf').value = detalhe.nf;
        document.getElementById('det-date').value = detalhe.data_hora;
        document.getElementById('det-total-value').innerText = `R$ ${formatMoney(detalhe.valor_total)}`;
        
        // Formata lista de itens
        let itemsText = "";
        if (detalhe.itens && detalhe.itens.length > 0) {
            itemsText = detalhe.itens.map(i => 
                `${i.produto} (x${i.qtd}) - R$ ${formatMoney(i.preco)} un.`
            ).join('\n');
        } else {
            itemsText = "Nenhum item registrado.";
        }
        document.getElementById('det-items').value = itemsText;

        // Lógica de Campos Específicos (Entrada vs Saída)
        const rowPayment = document.getElementById('row-payment');
        const labelOrigin = document.getElementById('label-origin-type');
        const supplierFields = document.getElementById('supplier-extra-fields');

        if (isEntry) {
            // Venda ao Cliente
            rowPayment.classList.remove('hidden');
            document.getElementById('det-payment').value = detalhe.forma_pagamento || '-';
            
            labelOrigin.innerText = 'CLIENTE (ORIGEM)';
            // Se o backend retornar o nome do cliente na "origem", usamos
            // Se for venda anônima, pode vir "Venda ao Cliente" ou NULL
            document.getElementById('det-origin-name').value = detalhe.origem || "Cliente não identificado";
            
            supplierFields.classList.add('hidden');
        } else {
            // Compra de Fornecedor
            rowPayment.classList.add('hidden');
            
            labelOrigin.innerText = 'FORNECEDOR';
            document.getElementById('det-origin-name').value = detalhe.origem || "Fornecedor";
            
            // Se o endpoint de detalhes retornasse CNPJ/Email, preencheríamos aqui.
            // Pelo código atual do backend (fluxoDB.py), ele retorna apenas 'origem' (nome)
            // e não os detalhes de contato. Vou ocultar os extras para não ficarem vazios.
            supplierFields.classList.add('hidden'); 
        }

        detailsOverlay.classList.remove('hidden');
    };

    if (btnClose) {
        btnClose.addEventListener('click', () => detailsOverlay.classList.add('hidden'));
    }

    // --- EVENTOS DE FILTRO ---
    document.getElementById('btn-filter-fluxo').addEventListener('click', renderFluxo);
    
    // Opcional: Atualizar ao mudar datas ou pressionar Enter nos inputs
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') renderFluxo();
        });
    });

    // Inicialização
    renderFluxo();
});