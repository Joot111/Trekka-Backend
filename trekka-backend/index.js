const express = require('express');
const mongoose = require('mongoose'); 
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. LIGAÇÃO AO MONGODB 
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB Atlas"))
  .catch(err => console.error("Erro ao conectar:", err));

// 2. MODELOS DE DADOS 
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Trail = mongoose.model('Trail', new mongoose.Schema({
  name: String,
  description: String,
  distanceMeters: Number,
  durationSeconds: Number,
  createdAt: { type: Number, default: Date.now },
  isPublic: { type: Boolean, default: false }, // NOVO: Campo de privacidade
  rating: { type: Number, default: 0 },         // NOVO: Avaliação média do trilho
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  points: [{
    latitude: Number,
    longitude: Number,
    timestamp: Number,
    orderIndex: Number
  }]
}));

// 3. ROTAS DE AUTENTICAÇÃO (Iguais)
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ token: "tk_" + user._id, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(400).json({ error: "Erro ao criar conta" }); }
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) {
    res.json({ token: "tk_" + user._id, user: { id: user._id, name: user.name, email: user.email } });
  } else { res.status(401).json({ error: "Credenciais inválidas" }); }
});

// 4. ROTAS DE TRILHOS 

// ATUALIZADO: Devolve apenas os trilhos públicos (para o Explorar)
app.get('/api/trails', async (req, res) => {
  try {
    const trails = await Trail.find({ isPublic: true }).sort({ createdAt: -1 }); 
    res.json(trails);
  } catch (err) { res.status(500).json({ error: "Erro ao buscar trilhos" }); }
});

// Obter trilho por ID
app.get('/api/trails/:id', async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (trail) res.json(trail);
    else res.status(404).json({ error: "Não encontrado" });
  } catch (err) { res.status(400).json({ error: "ID inválido" }); }
});

// Obter trilhos de um utilizador (devolve TODOS: públicos e privados)
app.get('/api/trails/user/:userId', async (req, res) => {
  const trails = await Trail.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(trails);
});

// Criar trilho (Upload)
app.post('/api/trails', async (req, res) => {
  try {
    const trail = new Trail(req.body);
    await trail.save();
    res.status(201).json(trail);
  } catch (err) { res.status(400).json({ error: "Erro ao salvar" }); }
});

app.delete('/api/trails/:id', async (req, res) => {
  await Trail.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// ATUALIZADO: Editar um trilho existente (Nome ou Privacidade)
app.put('/api/trails/:id', async (req, res) => {
  try {
    const updatedTrail = await Trail.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Atualiza apenas os campos enviados (ex: name, isPublic)
      { new: true }       // Devolve o objeto já atualizado
    );
    res.json(updatedTrail);
  } catch (err) {
    res.status(400).json({ error: "Erro ao atualizar trilho" });
  }
});

// NOVO: Rota para Avaliação (Rating)
app.post('/api/trails/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).send();

    // Lógica simples: vamos guardar a média (podes fazer algo mais complexo depois)
    trail.rating = rating; 
    await trail.save();
    res.json(trail);
  } catch (err) {
    res.status(400).send();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));