const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const syncData = require('./sync');
const Concurso = require('./models/Concurso.js');

const MONGO_URI = 'mongodb+srv://robertosantosloteria:cchzSvHgUzLHecmO@cluster0.fuyxwq1.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

const app = express();
app.use(cors());

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch(err => console.error("❌ Erro MongoDB", err));

// Rota: último concurso
app.get('/lotofacil/ultimo', async (req, res) => {
  const ultimo = await Concurso.findOne().sort({ concurso: -1 });
  res.json(ultimo);
});

// Rota: concurso específico
app.get('/lotofacil/:numero', async (req, res) => {
  const conc = await Concurso.findOne({ concurso: req.params.numero });
  res.json(conc);
});

// Rota: últimos X concursos
app.get('/lotofacil', async (req, res) => {
  const { limit = 10 } = req.query;
  const concursos = await Concurso.find().sort({ concurso: -1 }).limit(parseInt(limit));
  res.json(concursos);
});

// Rodar sincronização todo dia às 2h
cron.schedule('0 2 * * *', () => {
  console.log("⏳ Atualizando banco...");
  syncData();
});

app.get('/', (req, res) => {
  res.send('API da Lotofácil está funcionando! 🏆');
});

app.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));
