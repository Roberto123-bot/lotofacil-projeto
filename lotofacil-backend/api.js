// api.js
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Lotofacil from './models/Lotofacil.js'; // Seu modelo de concurso

dotenv.config(); // Carrega as variáveis do .env

// Use a mesma string de conexão do seu script de sincronização
const MONGO_URI = "mongodb+srv://robertosantosloteria:cchzSvHgUzLHecmO@cluster0.fuyxwq1.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

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

// Definir uma rota para buscar todos os concursos
app.get('/concursos', async (req, res) => {
  try {
    const concursos = await Lotofacil.find().sort({ concurso: 1 });
    res.json(concursos);
  } catch (err) {
    console.error("Erro ao buscar concursos:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Iniciar o servidor
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
});

// ... dentro do seu arquivo api.js

app.get('/analise/frequencia', async (req, res) => {
  try {
    const concursos = await Lotofacil.find({}, { dezenas: 1 }); // Buscar apenas as dezenas
    const frequencia = {};
    for (let i = 1; i <= 25; i++) {
      frequencia[i] = 0; // Inicializa o contador para cada dezena
    }

    concursos.forEach(concurso => {
      concurso.dezenas.forEach(dezena => {
        frequencia[parseInt(dezena)]++;
      });
    });

    // Converter o objeto para um array para facilitar a ordenação
    const resultado = Object.keys(frequencia).map(key => ({
      dezena: parseInt(key),
      total: frequencia[key]
    })).sort((a, b) => b.total - a.total); // Ordena do mais frequente para o menos

    res.json(resultado);
  } catch (err) {
    console.error("Erro na análise de frequência:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// ... dentro do seu arquivo api.js

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

// Rota para buscar os últimos 'N' concursos
app.get('/concursos/ultimos/:quantidade', async (req, res) => {
  try {
    const quantidade = parseInt(req.params.quantidade);
    
    // A query busca todos os concursos, ordena pelo maior número (mais recente) e limita pela quantidade
    const concursos = await Lotofacil.find()
      .sort({ concurso: -1 })
      .limit(quantidade);
      
    // Envia os concursos em ordem crescente, do mais antigo para o mais recente
    res.json(concursos.reverse());
  } catch (err) {
    console.error("Erro ao buscar últimos concursos:", err);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});