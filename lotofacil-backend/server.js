// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Conexão MongoDB
mongoose.connect(process.env.MONGO_URI);

const lotofacilSchema = new mongoose.Schema({
  concurso: { type: Number, unique: true },
  data: String,
  dezenas: [String],
  premiacoes: Array,
  valorAcumuladoConcursoEspecial: Number,
  valorEstimadoProximoConcurso: Number,
});

const Lotofacil = mongoose.model("Lotofacil", lotofacilSchema, "lotofacils");

// 🔹 Função para normalizar os dados da API para o formato do banco
function normalizarConcurso(apiData) {
  return {
    concurso: apiData.numero,
    data: apiData.dataApuracao,
    dezenas: apiData.listaDezenas,
    premiacoes:
      apiData.listaRateioPremio?.map((p) => ({
        descricao: p.descricaoFaixa,
        ganhadores: p.numeroDeGanhadores,
        premio: p.valorPremio,
      })) || [],
    valorAcumuladoConcursoEspecial: apiData.valorAcumuladoConcursoEspecial || 0,
    valorEstimadoProximoConcurso: apiData.valorEstimadoProximoConcurso || 0,
  };
}

// 🔹 Função de sincronização
async function syncLotofacil() {
  try {
    const ultimoSalvo = await Lotofacil.findOne().sort({ concurso: -1 });
    const ultimoNumero = ultimoSalvo ? ultimoSalvo.concurso : 0;

    console.log("Último salvo no banco:", ultimoNumero);

    const { data: ultimoApi } = await axios.get(
      "https://api.guidi.dev.br/loteria/lotofacil/ultimo"
    );
    const ultimoApiNumero = Number(ultimoApi.numero);

    console.log("Último disponível na API:", ultimoApiNumero);

    if (ultimoNumero >= ultimoApiNumero) {
      console.log("Banco já está atualizado ✅");
      return;
    }

    for (let i = ultimoNumero + 1; i <= ultimoApiNumero; i++) {
      try {
        const { data } = await axios.get(
          `https://api.guidi.dev.br/loteria/lotofacil/${i}`
        );
        const doc = normalizarConcurso(data);
        await Lotofacil.create(doc);
        console.log(`✅ Concurso ${i} salvo com sucesso!`);
      } catch (err) {
        console.error(`⚠️ Erro ao salvar concurso ${i}:`, err.message);
      }
    }

    console.log("Sincronização concluída 🚀");
  } catch (error) {
    console.error("Erro na sincronização:", error.message);
  }
}

// 🔹 Rota: forçar sincronização manual
app.get("/sync", async (req, res) => {
  try {
    await syncLotofacil();
    res.json({ message: "Sincronização concluída com sucesso 🚀" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao sincronizar: " + error.message });
  }
});

// 🔹 Rota: análise de frequência
app.get("/analise/frequencia", async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$dezenas" },
      { $group: { _id: "$dezenas", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ];

    const resultado = await Lotofacil.aggregate(pipeline);

    res.json(
      resultado.map((item) => ({
        dezena: item._id,
        total: item.total,
      }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao calcular frequência: " + error.message });
  }
});

// 🔹 Rota: últimos concursos (para tabela de movimentação)
app.get("/concursos/ultimos/:qtd", async (req, res) => {
  try {
    const qtd = parseInt(req.params.qtd) || 10;
    const concursos = await Lotofacil.find().sort({ concurso: -1 }).limit(qtd);

    res.json(concursos.reverse()); // do mais antigo para o mais novo
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar concursos: " + error.message });
  }
});

// 🔹 Rota: último concurso
app.get("/concursos/ultimo", async (req, res) => {
  try {
    const ultimo = await Lotofacil.findOne().sort({ concurso: -1 });
    if (!ultimo) {
      return res.status(404).json({ error: "Nenhum concurso encontrado" });
    }
    res.json(ultimo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar último concurso: " + error.message });
  }
});

// 🔹 Rota de análise de duplas (com limite padrão)
app.get("/analise/duplas", async (req, res) => {
  try {
    // pega o query param ?limit=10, se não tiver usa 10 como padrão
    const limit = parseInt(req.query.limit) || 10;

    // busca só os últimos N concursos
    const concursos = await Lotofacil.find()
      .sort({ concurso: -1 }) // mais recentes primeiro
      .limit(limit);

    // gera todas as duplas dos concursos
    const contador = {};
    const ultimoConcurso = concursos[0]?.concurso || 0;

    concursos.forEach((c) => {
      const dezenas = c.dezenas;
      for (let i = 0; i < dezenas.length; i++) {
        for (let j = i + 1; j < dezenas.length; j++) {
          const dupla = [dezenas[i], dezenas[j]].sort().join("-");
          if (!contador[dupla]) {
            contador[dupla] = { qtd: 0, ultimoConcurso: 0 };
          }
          contador[dupla].qtd += 1;
          contador[dupla].ultimoConcurso = c.concurso; // guarda o concurso mais recente que a dupla apareceu
        }
      }
    });

    // transforma em array ordenado
    const resultado = Object.entries(contador).map(([dupla, dados]) => ({
      dupla,
      qtd: dados.qtd,
      ultimoConcurso: dados.ultimoConcurso,
      atraso: ultimoConcurso - dados.ultimoConcurso, // diferença entre último e o último que saiu
    }));

    resultado.sort((a, b) => b.qtd - a.qtd);

    res.json(resultado);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao calcular duplas: " + error.message });
  }
});

// 🔹 Cron: rodar automaticamente todo dia às 03h
cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Rodando sincronização automática da Lotofácil...");
  await syncLotofacil();
});

// 🔹 Rodar uma vez ao iniciar
syncLotofacil();

// 🔹 Rota base
app.get("/", (req, res) => {
  res.send("Servidor ativo 🚀");
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
