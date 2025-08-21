// routes/duplas.js
import express from "express";
import Lotofacil from "../models/Lotofacil.js";
import calcularDuplas from "../utils/duplas.js";

const router = express.Router();

// GET /lotofacil/duplas?limite=30
router.get("/duplas", async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 30;

    // Busca concursos mais recentes
    const concursos = await Lotofacil.find()
      .sort({ concurso: -1 })
      .limit(limite)
      .lean();

    // Calcula as duplas (passando os concursos na ordem correta)
    const duplas = calcularDuplas(concursos.reverse(), limite);

    res.json({
      limite,
      total: duplas.length,
      duplas,
    });
  } catch (err) {
    console.error("Erro ao calcular duplas:", err);
    res.status(500).json({ error: "Erro ao calcular duplas" });
  }
});

export default router;
