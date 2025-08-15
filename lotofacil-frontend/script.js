document.addEventListener('DOMContentLoaded', () => {
    // Código existente para a tabela de frequência (mantenha-o)
    const tableBodyFrequencia = document.querySelector('#frequencia-table tbody');
    const tableFrequencia = document.getElementById('frequencia-table');
    const loadingMessageFrequencia = document.getElementById('loading');

    const API_URL_FREQUENCIA = 'https://lotofacil-projeto.onrender.com/analise/frequencia';

    fetch(API_URL_FREQUENCIA)
        .then(response => response.json())
        .then(data => {
            loadingMessageFrequencia.style.display = 'none';
            tableFrequencia.style.display = 'table';
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.dezena}</td>
                    <td>${item.total}</td>
                `;
                tableBodyFrequencia.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Erro na requisição de frequência:', error);
            loadingMessageFrequencia.textContent = 'Erro ao carregar dados de frequência.';
        });

    // -------- NOVO CÓDIGO PARA A TABELA DE MOVIMENTAÇÃO --------

    const tableMovimentacao = document.getElementById('movimentacao-table');
    const tableMovimentacaoBody = document.querySelector('#movimentacao-table tbody');
    const tableMovimentacaoHeader = document.querySelector('#movimentacao-table thead tr');
    const loadingMovimentacao = document.getElementById('movimentacao-loading');

    // Cria as colunas para as dezenas de 1 a 25 no cabeçalho da tabela
    for (let i = 1; i <= 25; i++) {
        const th = document.createElement('th');
        th.textContent = i.toString().padStart(2, '0');
        tableMovimentacaoHeader.appendChild(th);
    }

    // Adiciona event listeners nos botões de movimentação
    document.querySelectorAll('.btn-movimentacao').forEach(button => {
        button.addEventListener('click', () => {
            const quantidade = button.dataset.quantidade;
            fetchMovimentacao(quantidade);
        });
    });

    // Função para buscar e renderizar a tabela de movimentação
    function fetchMovimentacao(quantidade) {
        loadingMovimentacao.style.display = 'block';
        tableMovimentacao.style.display = 'none';
        tableMovimentacaoBody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

        const API_URL_MOVIMENTACAO = `https://lotofacil-projeto.onrender.com/concursos/ultimos/${quantidade}`;

        fetch(API_URL_MOVIMENTACAO)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar dados de movimentação.');
                }
                return response.json();
            })
            .then(data => {
                loadingMovimentacao.style.display = 'none';
                tableMovimentacao.style.display = 'table';

                data.forEach(concurso => {
                    const row = document.createElement('tr');
                    const dezenaVencedora = concurso.dezenas;

                    // Coluna para o número do concurso
                    const cellConcurso = document.createElement('td');
                    cellConcurso.textContent = concurso.concurso;
                    row.appendChild(cellConcurso);

                    // ...
                    // Colunas para as dezenas de 1 a 25
                    for (let i = 1; i <= 25; i++) {
                        const cellDezena = document.createElement('td');
                        const span = document.createElement('span');

                        // Adicione esta linha para formatar o número com zero à esquerda (ex: '01', '02')
                        const numeroFormatado = i.toString().padStart(2, '0');
                        span.textContent = numeroFormatado;

                        // A verificação agora é feita com o número formatado
                        if (dezenaVencedora.includes(numeroFormatado)) {
                            span.classList.add('dezena-sorteada');
                        } else {
                            span.classList.add('dezena-nao-sorteada');
                        }

                        cellDezena.appendChild(span);
                        row.appendChild(cellDezena);
                    }
                    // ...
                    tableMovimentacaoBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Houve um problema com a requisição de movimentação:', error);
                loadingMovimentacao.textContent = 'Erro ao carregar a tabela. Por favor, tente novamente.';
            });
    }

    // Carregar a tabela de 10 concursos por padrão ao carregar a página
    fetchMovimentacao(10);
});