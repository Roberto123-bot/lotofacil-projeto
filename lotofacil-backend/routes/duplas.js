import express from "express";
import Lotofacil from "../models/Lotofacil.js";

const router = express.Router();

// 🔹 Rota para pegar as duplas mais frequentes
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const pipeline = [
      { $project: { dezenas: 1 } },
      { $unwind: "$dezenas" },
      {
        $group: {
          _id: null,
          concursos: { $push: "$dezenas" },
        },
      },
    ];

    // Busca todos os concursos
    const data = await Lotofacil.find({}, { dezenas: 1 }).lean();

    // Contador de duplas
    const duplasMap = new Map();

    data.forEach((doc) => {
      const dezenas = doc.dezenas.map(Number).sort((a, b) => a - b);
      for (let i = 0; i < dezenas.length; i++) {
        for (let j = i + 1; j < dezenas.length; j++) {
          const dupla = `${dezenas[i]}-${dezenas[j]}`;
          duplasMap.set(dupla, (duplasMap.get(dupla) || 0) + 1);
        }
      }
    });

    // Ordenar do mais frequente para o menos
    const resultado = Array.from(duplasMap, ([dupla, total]) => ({
      dupla,
      total,
    }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    res.json(resultado);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao calcular duplas: " + error.message });
  }
});

export default router;
