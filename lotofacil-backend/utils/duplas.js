// utils/duplas.js
function calcularDuplas(concursos, limiteConcursos = 30) {
  const contagem = {};

  // pega os últimos concursos
  const ultimos = concursos.slice(-limiteConcursos);

  for (const c of ultimos) {
    const dezenas = c.dezenas.map(Number).sort((a, b) => a - b);
    for (let i = 0; i < dezenas.length; i++) {
      for (let j = i + 1; j < dezenas.length; j++) {
        const dupla = `${dezenas[i]}-${dezenas[j]}`;
        contagem[dupla] = (contagem[dupla] || 0) + 1;
      }
    }
  }

  // transforma em array ordenado
  return Object.entries(contagem)
    .map(([dupla, qtd]) => ({ dupla, qtd }))
    .sort((a, b) => b.qtd - a.qtd);
}

export default calcularDuplas;
