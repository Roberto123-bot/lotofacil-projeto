// sync.js
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Lotofacil from './models/Lotofacil.js'; // seu model

const MONGO_URI = 'mongodb+srv://robertosantosloteria:cchzSvHgUzLHecmO@cluster0.fuyxwq1.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
const API_URL = 'https://api.guidi.dev.br/loteria/lotofacil/ultimo';

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    const resp = await fetch(API_URL);
    const ultimo = await resp.json();

    // Monta o documento com base nos nomes reais do JSON
    const doc = {
      concurso: ultimo.numero,
      data: ultimo.dataApuracao,
      dezenas: ultimo.listaDezenas,
      premiacoes: ultimo.listaRateioPremio,
      valorAcumuladoConcursoEspecial: ultimo.valorAcumuladoConcursoEspecial,
      valorEstimadoProximoConcurso: ultimo.valorEstimadoProximoConcurso
    };

    // Evita duplicar concursos
    const existe = await Lotofacil.findOne({ concurso: doc.concurso });
    if (existe) {
      console.log(`⚠ Concurso ${doc.concurso} já existe no banco.`);
    } else {
      await Lotofacil.create(doc);
      console.log(`✅ Concurso ${doc.concurso} inserido com sucesso!`);
    }

    console.log('📦 Documento salvo/checado:', doc);

    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');

  } catch (err) {
    console.error('❌ Erro no script:', err);
  }
}

main();
