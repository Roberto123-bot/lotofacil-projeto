// script.js
document.addEventListener("DOMContentLoaded", () => {
  // Código existente para a tabela de frequência
  const tableBodyFrequencia = document.querySelector("#frequencia-table tbody");
  const tableFrequencia = document.getElementById("frequencia-table");
  const loadingMessageFrequencia = document.getElementById("loading");

  const API_URL_FREQUENCIA =
    "https://lotofacil-projeto.onrender.com/analise/frequencia";

  fetch(API_URL_FREQUENCIA)
    .then((response) => response.json())
    .then((data) => {
      loadingMessageFrequencia.style.display = "none";
      tableFrequencia.style.display = "table";
      data.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                      <td>${index + 1}</td>
                      <td>${item.dezena}</td>
                      <td>${item.total}</td>
                  `;
        tableBodyFrequencia.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Erro na requisição de frequência:", error);
      loadingMessageFrequencia.textContent =
        "Erro ao carregar dados de frequência.";
    });

  // -------- TABELA DE MOVIMENTAÇÃO --------

  const tableMovimentacao = document.getElementById("movimentacao-table");
  const tableMovimentacaoBody = document.querySelector(
    "#movimentacao-table tbody"
  );
  const tableMovimentacaoHeader = document.querySelector(
    "#movimentacao-table thead tr"
  );
  const loadingMovimentacao = document.getElementById("movimentacao-loading");

  // Cria as colunas para as dezenas de 1 a 25 no cabeçalho da tabela
  for (let i = 1; i <= 25; i++) {
    const th = document.createElement("th");
    th.textContent = i.toString().padStart(2, "0");
    tableMovimentacaoHeader.appendChild(th);
  }

  // Event listeners nos botões
  document.querySelectorAll(".btn-movimentacao").forEach((button) => {
    button.addEventListener("click", () => {
      const quantidade = button.dataset.quantidade;
      fetchMovimentacao(quantidade);
    });
  });

  // Função para calcular estatísticas (já estava global, ótimo!)
  function calcularEstatisticas(concursos) {
    const frequencia = Array(26).fill(0);
    const atrasos = Array(26).fill(0);
    const ultimaOcorrencia = Array(26).fill(null);

    // Frequência e última ocorrência
    concursos.forEach((concurso, idx) => {
      concurso.dezenas.forEach((d) => {
        const num = parseInt(d, 10);
        frequencia[num]++;
        ultimaOcorrencia[num] = idx;
      });
    });

    // Atrasos (quantos concursos sem aparecer)
    for (let i = 1; i <= 25; i++) {
      if (ultimaOcorrencia[i] !== null) {
        atrasos[i] = concursos.length - 1 - ultimaOcorrencia[i];
      } else {
        atrasos[i] = concursos.length;
      }
    }

    // Sequência (quantos concursos seguidos saiu)
    const sequencia = Array(26).fill(0);
    for (let i = 1; i <= 25; i++) {
      let count = 0;
      for (let c = concursos.length - 1; c >= 0; c--) {
        if (concursos[c].dezenas.includes(i.toString().padStart(2, "0"))) {
          count++;
        } else {
          break;
        }
      }
      sequencia[i] = count;
    }

    // Temperatura (Q=quente, F=fria, M=média)
    const maxFreq = Math.max(...frequencia.slice(1));
    const minFreq = Math.min(...frequencia.slice(1));
    const temperatura = frequencia.map((f, i) => {
      if (i === 0) return "";
      if (f >= maxFreq * 0.7) return "Q";
      if (f <= minFreq * 1.3) return "F";
      return "M";
    });

    return { frequencia, atrasos, sequencia, temperatura };
  }

  // --- ALTERAÇÃO 1: Mover addLinha para fora e adicionar 'tbody' como argumento ---
  // Esta função agora é reutilizável por qualquer tabela
  function addLinha(tbody, titulo, valores) {
    const row = document.createElement("tr");
    row.classList.add(`linha-${titulo.toLowerCase().replace(".", "")}`); // adiciona classe baseada no título
    const cellTitulo = document.createElement("td");
    cellTitulo.textContent = titulo;
    row.appendChild(cellTitulo);

    for (let i = 1; i <= 25; i++) {
      const td = document.createElement("td");
      td.textContent = valores[i];

      // Para temperatura, colore letras Q, F, M
      if (titulo.startsWith("Temp")) {
        if (valores[i] === "Q") td.style.color = "red";
        if (valores[i] === "F") td.style.color = "blue";
        if (valores[i] === "M") td.style.color = "green";
        td.style.fontWeight = "bold";
      }

      row.appendChild(td);
    }
    tbody.appendChild(row); // Adiciona a linha ao 'tbody' correto
  }

  // Função para buscar e renderizar a tabela de movimentação
  function fetchMovimentacao(quantidade) {
    loadingMovimentacao.style.display = "block";
    tableMovimentacao.style.display = "none";
    tableMovimentacaoBody.innerHTML = "";

    const API_URL_MOVIMENTACAO = `https://lotofacil-projeto.onrender.com/concursos/ultimos/${quantidade}`;

    fetch(API_URL_MOVIMENTACAO)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar dados de movimentação.");
        }
        return response.json();
      })
      .then((data) => {
        loadingMovimentacao.style.display = "none";
        tableMovimentacao.style.display = "table";

        // Renderiza concursos
        data.forEach((concurso) => {
          const row = document.createElement("tr");
          const cellConcurso = document.createElement("td");
          cellConcurso.textContent = concurso.concurso;
          row.appendChild(cellConcurso);

          for (let i = 1; i <= 25; i++) {
            const cellDezena = document.createElement("td");
            const span = document.createElement("span");
            const numeroFormatado = i.toString().padStart(2, "0");
            span.textContent = numeroFormatado;

            if (concurso.dezenas.includes(numeroFormatado)) {
              span.classList.add("dezena-sorteada");
            } else {
              span.classList.add("dezena-nao-sorteada");
            }
            cellDezena.appendChild(span);
            row.appendChild(cellDezena);
          }

          // 🔹 Novo: permite destacar várias linhas
          row.addEventListener("click", () => {
            row.classList.toggle("linha-destacada"); // ativa/desativa destaque
          });

          tableMovimentacaoBody.appendChild(row);
        });

        // Calcula estatísticas
        const { frequencia, atrasos, sequencia, temperatura } =
          calcularEstatisticas(data);

        // --- ALTERAÇÃO 2: Atualizar a chamada para 'addLinha' ---
        // Agora passamos 'tableMovimentacaoBody' como o primeiro argumento
        addLinha(tableMovimentacaoBody, "Sequência", sequencia);
        addLinha(tableMovimentacaoBody, "Atrasos", atrasos);
        addLinha(tableMovimentacaoBody, "Frequência", frequencia);
        addLinha(tableMovimentacaoBody, "Temp.", temperatura);
      })
      .catch((error) => {
        console.error(
          "Houve um problema com a requisição de movimentação:",
          error
        );
        loadingMovimentacao.textContent =
          "Erro ao carregar a tabela. Por favor, tente novamente.";
      });
  }

  // Carregar a tabela de 10 concursos por padrão
  fetchMovimentacao(10);

  // ... (código do carregarUltimoConcurso não mudou, omitido por brevidade) ...
  async function carregarUltimoConcurso() {
    const resp = await fetch(
      "https://lotofacil-projeto.onrender.com/concursos/ultimo"
    );
    const data = await resp.json();

    document.getElementById("uc-concurso").textContent = data.concurso;
    document.getElementById("uc-data").textContent = data.data;

    // dezenas sorteadas em número inteiro
    const dezenasSorteadas = data.dezenas.map((d) => parseInt(d, 10));

    // monta painel 5x5 (1..25)
    const dezenasDiv = document.getElementById("uc-dezenas");
    dezenasDiv.innerHTML = "";
    for (let i = 1; i <= 25; i++) {
      const el = document.createElement("div");
      el.className = "dezena";
      el.textContent = String(i).padStart(2, "0");
      if (dezenasSorteadas.includes(i)) {
        el.classList.add("sorteada");
      }
      dezenasDiv.appendChild(el);
    }

    // valores acumulado e estimativa
    document.getElementById("uc-acumulado").textContent =
      data.valorAcumuladoConcursoEspecial.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    document.getElementById("uc-estimativa").textContent =
      data.valorEstimadoProximoConcurso.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  }

  carregarUltimoConcurso();

  // -------- NOVO CÓDIGO PARA A TABELA DAS CORES --------

  const tableCores = document.getElementById("cores-table");
  const tableCoresBody = document.querySelector("#cores-table tbody");
  const tableCoresHeader = document.querySelector("#cores-table thead tr");
  const loadingCores = document.getElementById("cores-loading");

  // Mapeamento das cores por dezena
  const mapaCores = {
    1: "vermelho",
    11: "vermelho",
    21: "vermelho",
    2: "amarelo",
    12: "amarelo",
    22: "amarelo",
    3: "verde",
    13: "verde",
    23: "verde",
    4: "marrom",
    14: "marrom",
    24: "marrom",
    5: "azul",
    15: "azul",
    25: "azul",
    6: "rosa",
    16: "rosa",
    7: "preto",
    17: "preto",
    8: "cinza",
    18: "cinza",
    9: "laranja",
    19: "laranja",
    10: "branco",
    20: "branco",
  };

  // Cria as colunas para as dezenas de 1 a 25 no cabeçalho da tabela
  for (let i = 1; i <= 25; i++) {
    const th = document.createElement("th");
    th.textContent = i.toString().padStart(2, "0");
    tableCoresHeader.appendChild(th);
  }

  // Event listeners nos botões
  document.querySelectorAll(".btn-cores").forEach((button) => {
    button.addEventListener("click", () => {
      const quantidade = button.dataset.quantidade;
      fetchCores(quantidade);
    });
  });

  // Função para buscar e renderizar a tabela de cores
  function fetchCores(quantidade) {
    loadingCores.style.display = "block";
    tableCores.style.display = "none";
    tableCoresBody.innerHTML = "";

    const API_URL_CORES = `https://lotofacil-projeto.onrender.com/concursos/ultimos/${quantidade}`;

    fetch(API_URL_CORES)
      .then((response) => {
        if (!response.ok)
          throw new Error("Erro ao buscar dados da tabela de cores.");
        return response.json();
      })
      .then((data) => {
        loadingCores.style.display = "none";
        tableCores.style.display = "table";

        // Renderiza concursos
        data.forEach((concurso) => {
          const row = document.createElement("tr");
          const cellConcurso = document.createElement("td");
          cellConcurso.textContent = concurso.concurso;
          row.appendChild(cellConcurso);

          for (let i = 1; i <= 25; i++) {
            const cell = document.createElement("td");
            const span = document.createElement("span");
            const numeroFormatado = i.toString().padStart(2, "0");
            span.textContent = numeroFormatado;

            // Define a cor conforme o mapeamento
            const cor = mapaCores[i];
            if (concurso.dezenas.includes(numeroFormatado)) {
              span.classList.add("cor-sorteada", `cor-${cor}`);
            } else {
              span.classList.add("cor-nao-sorteada");
            }

            cell.appendChild(span);
            row.appendChild(cell);
          }

          // Permite destacar linhas
          row.addEventListener("click", () => {
            row.classList.toggle("linha-destacada");
          });

          tableCoresBody.appendChild(row);
        });

        // --- ALTERAÇÃO 3: Adicionar o cálculo e renderização do rodapé ---
        // Exatamente como foi feito na 'fetchMovimentacao'

        // Calcula estatísticas
        const { frequencia, atrasos, sequencia, temperatura } =
          calcularEstatisticas(data);

        // Renderiza linhas extras
        addLinha(tableCoresBody, "Sequência", sequencia);
        addLinha(tableCoresBody, "Atrasos", atrasos);
        addLinha(tableCoresBody, "Frequência", frequencia);
        addLinha(tableCoresBody, "Temp.", temperatura);
      })
      .catch((error) => {
        console.error("Erro ao carregar tabela de cores:", error);
        loadingCores.textContent = "Erro ao carregar tabela de cores.";
      });
  }

  // Carregar a tabela de 10 concursos por padrão
  fetchCores(10);

  /**
   * Melhora 4: Interatividade (Highlight de Coluna)
   * Versão atualizada com multi-select e toggle.
   */
  function setupColumnHighlighting(tableSelector) {
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const headers = table.querySelectorAll("thead th");

    headers.forEach((th, index) => {
      // Pula a primeira coluna "Concurso"
      if (index === 0) return;

      // 1. Adiciona um listener de clique a cada cabeçalho
      th.addEventListener("click", () => {
        // 2. Verifica se a coluna (o próprio th) já está destacada
        const isHighlighted = th.classList.contains("coluna-destacada");

        // 3. Pega todas as células daquela coluna no body
        const allRows = table.querySelectorAll("tbody tr");

        // 4. Lógica de TOGLE (marcar/desmarcar)
        if (isHighlighted) {
          // Se já está marcada, remove a classe do header...
          th.classList.remove("coluna-destacada");
          // ...e de todas as células da coluna
          allRows.forEach((row) => {
            const cell = row.querySelector(`td:nth-child(${index + 1})`);
            if (cell) {
              cell.classList.remove("coluna-destacada");
            }
          });
        } else {
          // Se não está marcada, adiciona a classe no header...
          th.classList.add("coluna-destacada");
          // ...e em todas as células da coluna
          allRows.forEach((row) => {
            const cell = row.querySelector(`td:nth-child(${index + 1})`);
            if (cell) {
              cell.classList.add("coluna-destacada");
            }
          });
        }
      });
    });
  }

  // Chame a função para suas duas tabelas
  setupColumnHighlighting("#movimentacao-table");
  setupColumnHighlighting("#cores-table");
});
