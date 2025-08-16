// models/Lotofacil.js
import mongoose from 'mongoose';

const novoConcurso = new Lotofacil({
  concurso: dados.concurso,
  data: dados.data,
  dezenas: dados.dezenas.sort(), // array de strings
  premiacoes: dados.premiacoes || [],
  valorAcumuladoConcursoEspecial: dados.valorAcumuladoConcursoEspecial || 0,
  valorEstimadoProximoConcurso: dados.valorEstimadoProximoConcurso || 0
});

export default mongoose.model('Lotofacil', LotofacilSchema);
