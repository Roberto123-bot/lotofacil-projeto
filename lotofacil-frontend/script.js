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

  // -------- NOVO CÓDIGO PARA A TABELA DE MOVIMENTAÇÃO --------

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

  // Função para calcular estatísticas
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
          tableMovimentacaoBody.appendChild(row);
        });

        // Calcula estatísticas
        const { frequencia, atrasos, sequencia, temperatura } =
          calcularEstatisticas(data);

        // Renderiza linhas extras
        function addLinha(titulo, valores) {
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
          tableMovimentacaoBody.appendChild(row);
        }

        addLinha("Sequência", sequencia);
        addLinha("Atrasos", atrasos);
        addLinha("Frequência", frequencia);
        addLinha("Temp.", temperatura);
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

  // 🔹 Função principal para carregar duplas do BACKEND
  async function carregarDuplas(qtdConcursos = 10) {
    const loading = document.getElementById("duplas-loading");
    const tabela = document.getElementById("duplas-table");
    const tbody = tabela.querySelector("tbody");

    loading.style.display = "block";
    tabela.style.display = "none";
    tbody.innerHTML = "";

    try {
      // ✅ Agora consulta direto o backend (que já calcula as duplas)
      const resp = await fetch(
        `https://lotofacil-projeto.onrender.com/duplas?limite=${qtdConcursos}`
      );
      const duplas = await resp.json();

      // Preencher tabela
      duplas.forEach((d) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
    <td>${d.dupla}</td>
    <td>${d.qtd}</td>
    <td>${d.atraso}</td>
    <td>${d.ultimoConcurso ?? "-"}</td>
  `;
        tbody.appendChild(tr);
      });

      loading.style.display = "none";
      tabela.style.display = "table";
    } catch (err) {
      console.error("Erro ao carregar duplas:", err);
      loading.textContent = "Erro ao carregar duplas!";
    }
  }

  // 🔹 Eventos dos botões da aba Duplas
  document.querySelectorAll(".btn-duplas").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qtd = btn.getAttribute("data-quantidade");
      carregarDuplas(qtd);
    });
  });

  // 🔹 Carregar por padrão ao abrir a aba Duplas
  document
    .querySelector('[data-tab="duplas"]')
    .addEventListener("click", () => carregarDuplas(10));
});
