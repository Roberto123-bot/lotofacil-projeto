// syncAll.js
import mongoose from "mongoose";
import fetch from "node-fetch";
import Lotofacil from "./models/Lotofacil.js";

const MONGO_URI = "mongodb+srv://robertosantosloteria:cchzSvHgUzLHecmO@cluster0.fuyxwq1.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0"; // ajuste se precisar
const API_BASE = "https://servicebus2.caixa.gov.br/portaldeloterias/api/lotofacil";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB");
  } catch (err) {
    console.error("Erro ao conectar no MongoDB:", err);
    process.exit(1);
  }
}

async function buscarConcurso(numero) {
  const resp = await fetch(`${API_BASE}/${numero}`, {
    headers: { "accept": "application/json" }
  });
  if (!resp.ok) {
    console.log(`⚠️ Concurso ${numero} não encontrado`);
    return null;
  }
  return await resp.json();
}

async function buscarUltimoConcurso() {
  const resp = await fetch(`${API_BASE}`, {
    headers: { "accept": "application/json" }
  });
  const data = await resp.json();
  return data.numero;
}

async function salvarConcurso(dados) {
  try {
    await Lotofacil.create({
      concurso: dados.numero,
      data: dados.dataApuracao,
      dezenas: dados.listaDezenas,
      premiacoes: dados.listaRateioPremio.map(p => ({
        descricaoFaixa: p.descricaoFaixa,
        faixa: p.faixa,
        numeroDeGanhadores: p.numeroDeGanhadores,
        valorPremio: p.valorPremio
      })),
      valorAcumuladoConcursoEspecial: dados.valorAcumuladoConcursoEspecial,
      valorEstimadoProximoConcurso: dados.valorEstimadoProximoConcurso
    });
    console.log(`✅ Concurso ${dados.numero} salvo com sucesso`);
  } catch (err) {
    console.error(`Erro ao salvar concurso ${dados.numero}:`, err.message);
  }
}

async function syncAll() {
  await connectDB();

  const ultimo = await buscarUltimoConcurso();
  console.log(`📌 Último concurso: ${ultimo}`);

  for (let i = 1; i <= ultimo; i++) {
    const existe = await Lotofacil.findOne({ concurso: i });
    if (existe) {
      console.log(`⏭️ Concurso ${i} já existe, pulando...`);
      continue;
    }

    const dados = await buscarConcurso(i);
    if (dados) {
      await salvarConcurso(dados);
      await new Promise(res => setTimeout(res, 500)); // pausa pra evitar bloqueio
    }
  }

  console.log("🎯 Sincronização completa!");
  mongoose.connection.close();
}

syncAll();
