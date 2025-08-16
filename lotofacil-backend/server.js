// index.js
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import axios from 'axios';
import Lotofacil from './models/Lotofacil.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Substitua a sua função syncData inteira por esta
async function syncData() {
  console.log('🔄 Iniciando a sincronização dos dados...');
  try {
    const urlBase = 'https://api.guidi.dev.br/loteria/lotofacil';
    const response = await axios.get(`${urlBase}/ultimo`);

    // VERIFICAÇÃO DE SEGURANÇA
    if (!response || !response.data || !response.data.concurso) {
      console.error('❌ Erro: Resposta da API pública inválida ou incompleta.');
      return; 
    }

    const ultimoConcursoNaAPI = response.data.concurso;
    const ultimoConcursoSalvo = await Lotofacil.findOne().sort({ concurso: -1 });
    const ultimoConcursoDoBanco = ultimoConcursoSalvo ? ultimoConcursoSalvo.concurso : 0;

    console.log(`✅ Último concurso na API: ${ultimoConcursoNaAPI}`);
    console.log(`✅ Último concurso salvo no banco: ${ultimoConcursoDoBanco}`);

    for (let i = ultimoConcursoDoBanco + 1; i <= ultimoConcursoNaAPI; i++) {
      try {
        const concursoExistente = await Lotofacil.findOne({ concurso: i });
        if (concursoExistente) {
          console.log(`❕ Concurso ${i} já existe no banco de dados. Pulando.`);
          continue; 
        }

        const res = await axios.get(`${urlBase}/${i}`);
        const dados = res.data;
        const novoConcurso = new Lotofacil({
          concurso: dados.concurso,
          data: dados.data,
          dezenas: dados.dezenas.sort(),
          local: dados.local,
          valorEstimadoProximoConcurso: dados.valorEstimadoProximoConcurso
        });
        await novoConcurso.save();
        console.log(`✅ Concurso ${i} salvo com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao buscar/salvar o concurso ${i}:`, error.message);
      }
    }
    console.log('✅ Sincronização concluída.');
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
  }
}

// Conectar ao MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Conectado ao MongoDB para a API");
  } catch (err) {
    console.error("Erro ao conectar no MongoDB:", err);
    process.exit(1);
  }
}

// Iniciar o servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    
    syncData(); // Inicia a sincronização no primeiro deploy

    // Agende a tarefa para rodar todos os dias às 21:00 (9 PM)
    cron.schedule('* * * * *', () => {
      console.log('Agendador: Executando a sincronização diária...');
      syncData();
    }, {
      timezone: "America/Sao_Paulo"
    });
  });
});

// Definir as rotas para a API
app.get('/analise/frequencia', async (req, res) => {
  try {
    const concursos = await Lotofacil.find({}, { dezenas: 1 });
    const frequencia = {};
    for (let i = 1; i <= 25; i++) {
      frequencia[i] = 0;
    }

    concursos.forEach(concurso => {
      concurso.dezenas.forEach(dezena => {
        frequencia[parseInt(dezena)]++;
      });
    });

    const resultado = Object.keys(frequencia).map(key => ({
      dezena: parseInt(key),
      total: frequencia[key]
    })).sort((a, b) => b.total - a.total);

    res.json(resultado);
  } catch (err) {
    console.error("Erro na análise de frequência:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get('/concursos/ultimos/:quantidade', async (req, res) => {
  try {
    const quantidade = parseInt(req.params.quantidade);
    const concursos = await Lotofacil.find()
      .sort({ concurso: -1 })
      .limit(quantidade);
      
    res.json(concursos.reverse());
  } catch (err) {
    console.error("Erro ao buscar últimos concursos:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

app.get('/analise/parimpar', async (req, res) => {
  try {
    const concursos = await Lotofacil.find({});
    const resultado = concursos.map(concurso => {
      let pares = 0;
      let impares = 0;
      concurso.dezenas.forEach(dezena => {
        if (parseInt(dezena) % 2 === 0) {
          pares++;
        } else {
          impares++;
        }
      });
      return {
        concurso: concurso.concurso,
        pares: pares,
        impares: impares,
        data: concurso.data
      };
    });
    res.json(resultado);
  } catch (err) {
    console.error("Erro na análise de par e ímpar:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});