// models/Lotofacil.js
import mongoose from 'mongoose';

const LotofacilSchema = new mongoose.Schema({
  concurso: { type: Number, required: true, unique: true },
  data: { type: String, required: true },
  dezenas: { type: [String], required: true },
  local: { type: String }, // <--- adicionar
  premiacoes: { type: Array, default: [] },
  valorAcumuladoConcursoEspecial: { type: Number, default: 0 },
  valorEstimadoProximoConcurso: { type: Number, default: 0 }
});

export default mongoose.model('Lotofacil', LotofacilSchema);
