// 🔹 Gerar todas as 2300 combinações de trios da Lotofácil
function gerarTrios() {
  const trios = [];
  for (let i = 1; i <= 25; i++) {
    for (let j = i + 1; j <= 25; j++) {
      for (let k = j + 1; k <= 25; k++) {
        trios.push([i, j, k]);
      }
    }
  }
  return trios;
}

// 🔹 Função principal para carregar trios
async function carregarTrios(qtdConcursos = 10) {
  const loading = document.getElementById("ternos-loading");
  const tabela = document.getElementById("ternos-table");
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

    const trios = gerarTrios();

    // Estatísticas de cada trio
    const stats = trios.map(([a, b, c]) => {
      let qtd = 0;
      let ultimoConcurso = null;
      let atraso = 0;

      concursos.forEach((concurso) => {
        const dezenas = concurso.dezenas.map(Number);
        if (dezenas.includes(a) && dezenas.includes(b) && dezenas.includes(c)) {
          qtd++;
          ultimoConcurso = concurso.concurso;
          atraso = 0;
        } else {
          atraso++;
        }
      });

      return {
        combinacao: `${String(a).padStart(2, "0")}-${String(b).padStart(
          2,
          "0"
        )}-${String(c).padStart(2, "0")}`,
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
        <td>${s.combinacao}</td>
        <td>${s.qtd}</td>
        <td>${s.atraso}</td>
        <td>${s.ultimoConcurso}</td>
      `;
      tbody.appendChild(tr);
    });

    loading.style.display = "none";
    tabela.style.display = "table";
  } catch (err) {
    console.error("Erro ao carregar trios:", err);
    loading.textContent = "Erro ao carregar trios!";
  }
}

// 🔹 Eventos dos botões da aba Trios
document.querySelectorAll(".btn-ternos").forEach((btn) => {
  btn.addEventListener("click", () => {
    const qtd = btn.getAttribute("data-quantidade");
    carregarTrios(qtd);
  });
});

// 🔹 Carregar por padrão ao abrir a aba Trios
document
  .querySelector('[data-tab="trios"]')
  .addEventListener("click", () => carregarTrios(10));
