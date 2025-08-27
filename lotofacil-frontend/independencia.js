const dados = {
  concursos: [
    {
      id: 800,
      data: "06/09/2012",
      numeros: [3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 16, 20, 21, 22, 24],
    },
    {
      id: 952,
      data: "07/09/2013",
      numeros: [1, 3, 4, 6, 8, 11, 12, 14, 17, 18, 19, 21, 22, 23, 25],
    },
    {
      id: 1102,
      data: "07/09/2014",
      numeros: [2, 3, 5, 6, 8, 12, 14, 15, 18, 19, 20, 21, 22, 23, 24],
    },
    {
      id: 1255,
      data: "08/09/2015",
      numeros: [1, 2, 4, 6, 7, 9, 10, 13, 14, 16, 18, 20, 21, 23, 25],
    },
    {
      id: 1408,
      data: "06/09/2016",
      numeros: [1, 3, 5, 8, 10, 11, 12, 13, 14, 19, 21, 22, 23, 24, 25],
    },
    {
      id: 1557,
      data: "07/09/2017",
      numeros: [2, 3, 4, 5, 6, 9, 12, 16, 17, 18, 20, 21, 22, 24, 25],
    },
    {
      id: 1708,
      data: "08/09/2018",
      numeros: [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 17, 18, 22],
    },
    {
      id: 1861,
      data: "06/09/2019",
      numeros: [2, 3, 5, 6, 7, 8, 9, 13, 14, 16, 18, 22, 23, 24, 25],
    },
    {
      id: 2030,
      data: "12/09/2020",
      numeros: [2, 3, 4, 5, 6, 9, 10, 12, 14, 15, 17, 19, 22, 23, 25],
    },
    {
      id: 2320,
      data: "11/09/2021",
      numeros: [1, 2, 3, 5, 6, 9, 12, 13, 15, 17, 21, 22, 23, 24, 25],
    },
    {
      id: 2610,
      data: "10/09/2022",
      numeros: [1, 3, 5, 7, 8, 9, 10, 11, 12, 15, 16, 17, 20, 22, 24],
    },
    {
      id: 2900,
      data: "09/09/2023",
      numeros: [1, 3, 4, 5, 6, 7, 10, 11, 14, 18, 19, 20, 23, 24, 25],
    },
    {
      id: 3190,
      data: "09/09/2024",
      numeros: [3, 4, 5, 6, 10, 12, 13, 15, 16, 18, 19, 21, 22, 23, 25],
    },
  ],
};

const tabela = document.getElementById("tabela-movimentacao");
const thead = tabela.getElementsByTagName("thead")[0];
const tbody = tabela.getElementsByTagName("tbody")[0];
const headerRow = thead.getElementsByTagName("tr")[0];

// 1. Gerar as colunas de 1 a 25 no cabeçalho
for (let i = 1; i <= 25; i++) {
  const th = document.createElement("th");
  th.textContent = i.toString().padStart(2, "0");
  headerRow.appendChild(th);
}

// 2. Preencher o corpo da tabela com os dados
dados.concursos.forEach((concurso) => {
  const row = tbody.insertRow();

  // Célula para o ID
  const cellId = row.insertCell(0);
  cellId.textContent = concurso.id;

  // Célula para a Data
  const cellData = row.insertCell(1);
  cellData.textContent = concurso.data;

  // Células para os números de 1 a 25
  const numerosSorteados = new Set(concurso.numeros);
  for (let i = 1; i <= 25; i++) {
    const cell = row.insertCell(i + 1);
    const numero = i.toString().padStart(2, "0");
    cell.textContent = numero;

    if (numerosSorteados.has(i)) {
      cell.classList.add("numero-sorteado");
    } else {
      cell.classList.add("numero-nao-sorteado");
    }
  }
});
