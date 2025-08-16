// syncLotofacil.js
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Conexão MongoDB
mongoose.connect(process.env.MONGO_URI);

const lotofacilSchema = new mongoose.Schema({
  concurso: { type: Number, unique: true },
  data: String,
  dezenas: [String],
  premiacoes: Array,
  valorAcumuladoConcursoEspecial: Number,
  valorEstimadoProximoConcurso: Number
});

const Lotofacil = mongoose.model("Lotofacil", lotofacilSchema, "lotofacils");

// 🔹 Função para normalizar os dados da API para o formato do banco
function normalizarConcurso(apiData) {
  return {
    concurso: apiData.numero,
    data: apiData.dataApuracao,
    dezenas: apiData.listaDezenas,
    premiacoes: apiData.listaRateioPremio?.map(p => ({
      descricao: p.descricaoFaixa,
      ganhadores: p.numeroDeGanhadores,
      premio: p.valorPremio
    })) || [],
    valorAcumuladoConcursoEspecial: apiData.valorAcumuladoConcursoEspecial || 0,
    valorEstimadoProximoConcurso: apiData.valorEstimadoProximoConcurso || 0
  };
}

async function syncLotofacil() {
  try {
    // 1 - Descobrir último concurso salvo
    const ultimoSalvo = await Lotofacil.findOne().sort({ concurso: -1 });
    const ultimoNumero = ultimoSalvo ? ultimoSalvo.concurso : 0;

    console.log("Último salvo no banco:", ultimoNumero);

    // 2 - Buscar último concurso na API
    const { data: ultimoApi } = await axios.get("https://api.guidi.dev.br/loteria/lotofacil/ultimo");
    const ultimoApiNumero = Number(ultimoApi.numero);

    console.log("Último disponível na API:", ultimoApiNumero);

    // 3 - Se já está atualizado, encerrar
    if (ultimoNumero >= ultimoApiNumero) {
      console.log("Banco já está atualizado ✅");
      return;
    }

    // 4 - Buscar concursos faltantes
    for (let i = ultimoNumero + 1; i <= ultimoApiNumero; i++) {
      try {
        const { data } = await axios.get(`https://api.guidi.dev.br/loteria/lotofacil/${i}`);
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
  } finally {
    mongoose.connection.close();
  }
}

syncLotofacil();
