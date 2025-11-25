// frontend/scripts/reestoque.js

document.addEventListener('DOMContentLoaded', () => {
    
    const purchaseList = document.getElementById('purchase-list');
    if (!purchaseList) return;

    const { formatMoney, showToast } = window.App;
    
    // Variáveis para armazenar dados auxiliares
    let allProducts = [];
    let allSuppliers = [];
    let currentEditNF = null; // Para saber qual NF estamos editando

    // --- 1. CONFIGURAÇÃO INICIAL (Datalists) ---
    const setupDatalists = async () => {
        try {
            // Busca dados reais do banco para o autocomplete
            [allProducts, allSuppliers] = await Promise.all([
                window.App.getProdutos(),
                window.App.getFornecedores()
            ]);

            // Preenche Datalist de Fornecedores
            const dlSup = document.getElementById('datalist-suppliers');
            dlSup.innerHTML = '';
            allSuppliers.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.cnpj; // Valor que vai no input
                opt.label = s.nome; // Texto de apoio
                dlSup.appendChild(opt);
            });

            // Preenche Datalist de Produtos
            const dlProd = document.getElementById('datalist-products');
            dlProd.innerHTML = '';
            allProducts.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.codigo; // Backend espera o código no POST
                opt.label = `${p.nome} - Estoque: ${p.estoque}`;
                dlProd.appendChild(opt);
            });

        } catch (err) {
            console.error("Erro ao carregar datalists:", err);
        }
    };
    
    setupDatalists(); // Chama ao carregar a página

    // --- 2. RENDERIZAÇÃO DA LISTA ---
    const renderPurchases = async () => {
        purchaseList.innerHTML = '<p style="text-align:center; padding:20px;">Carregando compras...</p>';
        
        // --- CORREÇÃO DOS FILTROS ---
        const busca = document.getElementById('filter-general')?.value || '';
        const dateMin = document.getElementById('filter-date-min')?.value || '';
        const dateMax = document.getElementById('filter-date-max')?.value || '';
        
        // Agora pegamos os valores diretos dos inputs que existem no HTML
        const valorMin = document.getElementById('filter-val-min')?.value || '';
        const valorMax = document.getElementById('filter-val-max')?.value || '';
        
        const filtros = {
            busca: busca,
            data_min: dateMin,
            data_max: dateMax,
            valor_min: valorMin,
            valor_max: valorMax
        };

        try {
            // Chama API
            const entries = await window.App.getReestoque(filtros);
            
            purchaseList.innerHTML = '';
            let totalFiltered = 0;

            if (!entries || entries.length === 0) {
                purchaseList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">Nenhuma compra encontrada.</p>';
                document.getElementById('total-filtered-display').innerText = `R$ 0,00`;
                return;
            }

            entries.forEach(p => {
                // Backend retorna: nf, data_hora, nome_fornecedor, cnpj_fornecedor, nome_produto, qtd, valor_total
                const total = parseFloat(p.valor_total);
                totalFiltered += total;

                const row = document.createElement('div');
                row.className = 'stock-item-row';
                
                // Botão de edição chama openEditPurchaseModal com o objeto completo
                // Precisamos serializar o objeto para passar no onclick ou usar um lookup
                // Aqui usaremos a abordagem de passar a NF e buscar no array local 'entries' se necessário,
                // mas como já temos os dados, podemos preencher direto.
                
                // Armazena dados no botão via dataset para facilitar recuperação
                const safeData = encodeURIComponent(JSON.stringify(p));

                row.innerHTML = `
                    <div class="stock-field-group pur-col-nf">
                        <label>Nota Fiscal</label>
                        <input type="text" value="${p.nf}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group pur-col-date">
                        <label>Data</label>
                        <input type="text" value="${p.data_hora}" readonly class="stock-input" style="font-size:11px;">
                    </div>
                    <div class="stock-field-group pur-col-sup">
                        <label>Fornecedor</label>
                        <input type="text" value="${p.nome_fornecedor}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group pur-col-cnpj">
                        <label>CNPJ</label>
                        <input type="text" value="${p.cnpj_fornecedor}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group pur-col-prod">
                        <label>Produto</label>
                        <input type="text" value="${p.nome_produto}" readonly class="stock-input">
                    </div>
                    <div class="stock-field-group pur-col-total">
                        <label>Total</label>
                        <input type="text" value="R$ ${formatMoney(total)}" readonly class="stock-input" style="text-align:right; font-weight:bold; color: var(--primary-color);">
                    </div>
                    <div class="pur-col-btn">
                        <button class="btn-edit-stock" onclick="window.openEditPurchaseModal('${safeData}')">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                `;
                purchaseList.appendChild(row);
            });

            document.getElementById('total-filtered-display').innerText = `R$ ${formatMoney(totalFiltered)}`;

        } catch (error) {
            console.error(error);
            purchaseList.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar dados.</p>';
        }
    };

    // Listeners de Filtro
    document.getElementById('filter-general')?.addEventListener('input', renderPurchases); // Busca ao digitar
    document.getElementById('btn-filter-trigger')?.addEventListener('click', renderPurchases); // Busca no botão (redundante mas útil)
    
    // Toggle Filtros Avançados
    document.getElementById('btn-toggle-filters')?.addEventListener('click', () => {
        document.getElementById('advanced-filters').classList.toggle('hidden');
    });
    
    // Filtros dentro do dropdown avançado
    document.querySelectorAll('#advanced-filters input, #advanced-filters select').forEach(el => {
        el.addEventListener('change', renderPurchases);
    });

    renderPurchases();


    // --- 3. NOVA COMPRA (MODAL) ---
    const overlay = document.getElementById('overlay-purchase');
    const form = document.getElementById('form-purchase');
    const btnNew = document.getElementById('btn-new-purchase');
    const btnDelete = document.getElementById('btn-delete-purchase-init');

    btnNew.addEventListener('click', () => {
        currentEditNF = null; // Modo Criação
        form.reset();
        
        // Configura Data/Hora atual
        const now = new Date();
        document.getElementById('pur-date').value = now.toISOString().split('T')[0];
        document.getElementById('pur-time').value = now.toTimeString().substring(0,5);
        
        // Libera campos que podem ser travados na edição
        document.getElementById('pur-nf').readOnly = false; 
        document.getElementById('pur-product').readOnly = false;
        document.getElementById('pur-cnpj').readOnly = false; 

        document.getElementById('modal-purchase-title').innerText = 'REGISTRAR ENTRADA ESTOQUE';
        btnDelete.classList.add('hidden'); // Esconde botão deletar
        overlay.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-purchase').addEventListener('click', () => overlay.classList.add('hidden'));

    // Auto-preencher Nome do Fornecedor ao selecionar CNPJ
    document.getElementById('pur-cnpj').addEventListener('input', (e) => {
        const val = e.target.value;
        const sup = allSuppliers.find(s => s.cnpj === val);
        if (sup) {
            document.getElementById('pur-supplier-name').value = sup.nome;
        }
    });

    // SUBMIT DO FORMULÁRIO (CRIAR OU EDITAR)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Coleta dados do form
        const dados = {
            cnpj_fornecedor: document.getElementById('pur-cnpj').value,
            nf: document.getElementById('pur-nf').value,
            data: document.getElementById('pur-date').value, // YYYY-MM-DD
            hora: document.getElementById('pur-time').value, // HH:MM
            codigo_produto: document.getElementById('pur-product').value, // Deve ser o código (ex: 789...)
            quantidade: document.getElementById('pur-qtd').value,
            valor_total: document.getElementById('pur-total').value
        };

        // Validação simples de Produto (deve ser um código existente)
        // Se o usuário digitou o nome, precisamos achar o código, ou o input deve exigir código.
        // O Datalist sugere o código no value, então assumimos que o usuário selecionou corretamente.
        // Se não, o backend vai retornar erro de FK.

        let res;
        if (currentEditNF) {
            // MODO EDIÇÃO (PUT)
            // A rota PUT /reestoque/<nf> atualiza. Nota: O Backend não permite mudar Fornecedor/Produto facilmente na edição simples, 
            // pois são chaves. Se mudar, seria melhor deletar e criar outro.
            // O reestoqueDB.atualizar_entrada atualiza Data, Valor, Qtd e recalcula estoque.
            res = await window.App.atualizarEntradaEstoque(currentEditNF, dados);
        } else {
            // MODO CRIAÇÃO (POST)
            res = await window.App.criarEntradaEstoque(dados);
        }

        if (res.ok) {
            showToast(currentEditNF ? 'Entrada atualizada!' : 'Entrada registrada!');
            overlay.classList.add('hidden');
            renderPurchases();
            // Se for nova compra, atualiza datalists se necessário (opcional)
        } else {
            const err = await res.json();
            alert(err.erro || "Erro ao salvar registro.");
        }
    });


    // --- 4. EDITAR COMPRA (Preencher Modal) ---
    window.openEditPurchaseModal = (encodedData) => {
        const p = JSON.parse(decodeURIComponent(encodedData));
        currentEditNF = p.nf; // Define NF global para edição

        document.getElementById('modal-purchase-title').innerText = 'EDITAR COMPRA';
        
        document.getElementById('pur-nf').value = p.nf;
        document.getElementById('pur-nf').readOnly = true; // NF é a chave, não muda fácil

        // Data e Hora vêm juntas do backend: "YYYY-MM-DD HH:MM:SS"
        if (p.data_hora) {
            const [datePart, timePart] = p.data_hora.split(' ');
            document.getElementById('pur-date').value = datePart; // Input type=date aceita YYYY-MM-DD
            document.getElementById('pur-time').value = timePart.substring(0, 5);
        }

        document.getElementById('pur-cnpj').value = p.cnpj_fornecedor;
        document.getElementById('pur-supplier-name').value = p.nome_fornecedor;
        
        // Importante: O input de produto espera o CÓDIGO (value do datalist). 
        // O objeto p tem 'codigo_produto' e 'nome_produto'.
        document.getElementById('pur-product').value = p.codigo_produto;
        
        document.getElementById('pur-qtd').value = p.qtd;
        document.getElementById('pur-total').value = p.valor_total;

        btnDelete.classList.remove('hidden'); // Mostra botão deletar
        overlay.classList.remove('hidden');
    };


    // --- 5. DELETAR COMPRA ---
    const deleteOverlay = document.getElementById('overlay-delete');
    
    btnDelete.addEventListener('click', () => {
        deleteOverlay.classList.remove('hidden');
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', () => deleteOverlay.classList.add('hidden'));

    // Hack para limpar listeners do botão confirmar (caso existam de outras execuções)
    const btnConfirmDel = document.getElementById('btn-confirm-delete');
    const newBtnDel = btnConfirmDel.cloneNode(true);
    btnConfirmDel.parentNode.replaceChild(newBtnDel, btnConfirmDel);

    newBtnDel.addEventListener('click', async () => {
        if (currentEditNF) {
            const res = await window.App.deletarEntradaEstoque(currentEditNF);
            if (res.ok) {
                showToast('Registro deletado e estoque estornado.');
                overlay.classList.add('hidden');
                deleteOverlay.classList.add('hidden');
                renderPurchases();
            } else {
                const err = await res.json();
                alert(err.erro || "Erro ao deletar.");
            }
        }
    });

});