// api.js
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';
import axios from 'axios';
import Lotofacil from './models/Lotofacil.js';

dotenv.config();

// A forma CORRETA de ler a string de conexão do ambiente de produção
const MONGO_URI = process.env.MONGO_URI;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Função que conterá a lógica de sincronização do syncAll.js
async function syncData() {
  console.log('🔄 Iniciando a sincronização dos dados...');
  try {
    const urlBase = 'http://loteriascaixa-api.herokuapp.com/api/lotofacil';
    const response = await axios.get(urlBase);
    const ultimoConcurso = response.data.concurso;

    const ultimoSalvo = await Lotofacil.findOne().sort({ concurso: -1 });
    const ultimoConcursoSalvo = ultimoSalvo ? ultimoSalvo.concurso : 0;

    console.log(`✅ Último concurso na API: ${ultimoConcurso}`);
    console.log(`✅ Último concurso salvo no banco: ${ultimoConcursoSalvo}`);

    for (let i = ultimoConcursoSalvo + 1; i <= ultimoConcurso; i++) {
      try {
        const res = await axios.get(`${urlBase}/${i}`);
        const dados = res.data;
        const novoConcurso = new Lotofacil({
          concurso: dados.concurso,
          data: dados.data,
          dezenas: dados.listaDezenas.sort(),
          local: dados.localSorteio,
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
    
    // Inicie a sincronização imediatamente no primeiro deploy
    syncData();

    // Agende a tarefa para rodar todos os dias às 21:00 (9 PM)
    cron.schedule('0 21 * * *', () => {
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

// A rota de parimpar que você tinha antes
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