import express from "express";
import LotoFacil from "../models/LotoFacil.js";

const router = express.Router();

// Gera todas as 300 combinações possíveis de 25 dezenas
function gerarDuplasPossiveis() {
  const duplas = [];
  for (let i = 1; i <= 25; i++) {
    for (let j = i + 1; j <= 25; j++) {
      duplas.push(`${i}-${j}`);
    }
  }
  return duplas;
}

router.get("/", async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;

    // Pega os últimos concursos
    const concursos = await LotoFacil.find()
      .sort({ concurso: -1 })
      .limit(limite);

    const duplasMap = new Map();
    const duplasPossiveis = gerarDuplasPossiveis();

    // Inicializa todas as duplas com contadores
    duplasPossiveis.forEach((d) => {
      duplasMap.set(d, {
        dupla: d,
        qtd: 0,
        ultimoConcurso: null,
        atraso: 0,
      });
    });

    // Preenche dados reais
    concursos.forEach((concurso) => {
      const dezenas = concurso.dezenas.map(Number);

      for (let i = 0; i < dezenas.length; i++) {
        for (let j = i + 1; j < dezenas.length; j++) {
          const dupla = `${Math.min(dezenas[i], dezenas[j])}-${Math.max(
            dezenas[i],
            dezenas[j]
          )}`;

          if (duplasMap.has(dupla)) {
            const d = duplasMap.get(dupla);
            d.qtd++;
            d.ultimoConcurso = concurso.concurso;
            duplasMap.set(dupla, d);
          }
        }
      }
    });

    // Calcula atraso: diferença do último concurso analisado para o último em que saiu
    const ultimoConcursoNum = concursos[0].concurso;
    duplasMap.forEach((d) => {
      if (d.ultimoConcurso) {
        d.atraso = ultimoConcursoNum - d.ultimoConcurso;
      } else {
        d.atraso = limite; // nunca saiu nos concursos analisados
      }
    });

    // Ordena por quantidade (mais frequentes primeiro)
    const resultado = Array.from(duplasMap.values()).sort(
      (a, b) => b.qtd - a.qtd
    );

    res.json(resultado);
  } catch (err) {
    console.error("Erro ao gerar duplas:", err);
    res.status(500).json({ error: "Erro ao gerar duplas" });
  }
});

export default router;
