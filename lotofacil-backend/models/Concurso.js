const mongoose = require('mongoose');

const ConcursoSchema = new mongoose.Schema({
  concurso: Number,
  data: String,
  dezenas: [String],
  premiacoes: Array,
  valorAcumuladoConcursoEspecial: Number,
  valorEstimadoProximoConcurso: Number
});

module.exports = mongoose.model('Concurso', ConcursoSchema);
