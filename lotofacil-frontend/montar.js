document.addEventListener("DOMContentLoaded", async () => {
  const painel = document.getElementById("painel");
  const resultadosDiv = document.getElementById("resultados");
  const inputQuantidade = document.getElementById("quantidade-concursos");
  let selecionados = [];
  let concursosCache = null;
  let totalConcursos = 100; // Valor padrão inicial

  const CLASSES_ACERTOS = {
    11: "acertos-11",
    12: "acertos-12",
    13: "acertos-13",
    14: "acertos-14",
    15: "acertos-15",
  };

  // Cria os 25 botões
  for (let i = 1; i <= 25; i++) {
    const btn = document.createElement("div");
    btn.classList.add("num");
    btn.textContent = String(i).padStart(2, "0");
    btn.addEventListener("click", () => {
      btn.classList.toggle("selecionado");
      selecionados = selecionados.includes(i)
        ? selecionados.filter((n) => n !== i)
        : [...selecionados, i];
    });
    painel.appendChild(btn);
  }

  // Carrega o último concurso para obter o total e define no input
  async function obterTotalConcursos() {
    try {
      const res = await fetch(
        "https://lotofacil-projeto.onrender.com/concursos/ultimo"
      );
      const data = await res.json();
      totalConcursos = data.concurso || 100; // Usa o número do último concurso como total
      inputQuantidade.value = totalConcursos; // Define como padrão para analisar todos
      inputQuantidade.max = totalConcursos; // Limita o máximo no input
      return totalConcursos;
    } catch (err) {
      console.error("Erro ao obter total de concursos:", err);
      return 100;
    }
  }

  // Chama ao carregar a página
  await obterTotalConcursos();

  // Carrega os últimos X concursos
  async function carregarConcursos(quantidade) {
    if (concursosCache && concursosCache.length === quantidade) {
      return concursosCache;
    }
    try {
      const res = await fetch(
        `https://lotofacil-projeto.onrender.com/concursos/ultimos/${quantidade}`
      );
      concursosCache = await res.json();
      return concursosCache;
    } catch (err) {
      console.error("Erro ao carregar concursos:", err);
      return [];
    }
  }

  function criarLinhaResultado(concurso, acertos) {
    const linha = document.createElement("div");
    linha.classList.add("linha-resultado");
    linha.textContent = `Concurso: ${concurso.concurso} - Acertos: ${acertos}`;
    if (CLASSES_ACERTOS[acertos]) {
      linha.classList.add(CLASSES_ACERTOS[acertos]);
    }
    return linha;
  }

  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  document.getElementById("conferir").addEventListener(
    "click",
    debounce(async () => {
      resultadosDiv.innerHTML = "<strong>Carregando...</strong>";

      const quantidade = parseInt(inputQuantidade?.value) || totalConcursos;
      if (quantidade < 1 || quantidade > totalConcursos) {
        resultadosDiv.innerHTML = `<strong>A quantidade deve ser entre 1 e ${totalConcursos}.</strong>`;
        return;
      }
      if (selecionados.length < 1 || selecionados.length > 25) {
        resultadosDiv.innerHTML =
          "<strong>Selecione entre 15 e 20 números.</strong>";
        return;
      }

      const concursos = await carregarConcursos(quantidade);
      resultadosDiv.innerHTML = "";

      if (selecionados.length === 0) {
        resultadosDiv.innerHTML =
          "<strong>Selecione seus números primeiro.</strong>";
        return;
      }

      const fragment = document.createDocumentFragment();
      concursos.forEach((concurso) => {
        const dezenas = concurso.dezenas.map((d) => parseInt(d, 10));
        const acertos = [...new Set(selecionados)].filter((n) =>
          new Set(dezenas).has(n)
        ).length;
        fragment.appendChild(criarLinhaResultado(concurso, acertos));
      });
      resultadosDiv.appendChild(fragment);
    }, 300)
  );

  document.getElementById("limpar").addEventListener("click", () => {
    selecionados = [];
    document
      .querySelectorAll(".num")
      .forEach((n) => n.classList.remove("selecionado"));
    resultadosDiv.innerHTML = "<strong>Resultados aparecerão aqui...</strong>";
  });
});
