// 🔹 Gerar todas as 300 combinações de duplas da Lotofácil
function gerarDuplas() {
  const duplas = [];
  for (let i = 1; i <= 25; i++) {
    for (let j = i + 1; j <= 25; j++) {
      duplas.push([i, j]);
    }
  }
  return duplas;
}

// 🔹 Função principal para carregar duplas
async function carregarDuplas(qtdConcursos = 10) {
  const loading = document.getElementById("duplas-loading");
  const tabela = document.getElementById("duplas-table");
  const tbody = tabela.querySelector("tbody");

  loading.style.display = "block";
  tabela.style.display = "none";
  tbody.innerHTML = "";

  try {
    // Buscar últimos concursos do backend
    const resp = await fetch(
      `https://lotofacil-projeto.onrender.com/concursos/ultimos/${qtdConcursos}`
    );
    const concursos = await resp.json();

    const duplas = gerarDuplas();

    // Estatísticas de cada dupla
    const stats = duplas.map(([a, b]) => {
      let qtd = 0;
      let ultimoConcurso = null;
      let atraso = 0;

      concursos.forEach((c, idx) => {
        const dezenas = c.dezenas.map(Number);
        if (dezenas.includes(a) && dezenas.includes(b)) {
          qtd++;
          ultimoConcurso = c.concurso;
          atraso = 0;
        } else {
          atraso++;
        }
      });

      return {
        dupla: `${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`,
        qtd,
        atraso,
        ultimoConcurso: ultimoConcurso ?? "-",
      };
    });

    // Ordenar por qtd decrescente
    stats.sort((x, y) => y.qtd - x.qtd);

    // Preencher tabela
    stats.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.dupla}</td>
        <td>${s.qtd}</td>
        <td>${s.atraso}</td>
        <td>${s.ultimoConcurso}</td>
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
