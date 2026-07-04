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
  isPublic: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  userId: { type: String }, // Guardamos como String para facilitar
  points: [{
    latitude: Number,
    longitude: Number,
    timestamp: Number,
    orderIndex: Number
  }]
}));

// 3. ROTAS DE AUTENTICAÇÃO 
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({
      token: "tk_" + user._id,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(400).json({ error: "Erro ao criar conta" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) {
    res.json({
      token: "tk_" + user._id,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } else {
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

// 4. ROTAS DE TRILHOS 
app.get('/api/trails', async (req, res) => {
  try {
    const trails = await Trail.find({ isPublic: true }).sort({ createdAt: -1 }); 
    res.json(trails);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar trilhos" });
  }
});

app.get('/api/trails/:id', async (req, res) => {
  try {
    const trail = await Trail.findById(req.params.id);
    if (trail) res.json(trail);
    else res.status(404).json({ error: "Não encontrado" });
  } catch (err) {
    res.status(400).json({ error: "ID inválido" });
  }
});

app.get('/api/trails/user/:userId', async (req, res) => {
  try {
    const trails = await Trail.find({ userId: req.params.userId }).sort({ createdAt: -1 }); 
    res.json(trails);
  } catch (err) {
    res.status(500).json({ error: "Erro" });
  }
});

app.post('/api/trails', async (req, res) => {
  try {
    const trail = new Trail(req.body);
    await trail.save();
    res.status(201).json(trail);
  } catch (err) {
    res.status(400).json({ error: "Erro ao salvar" });
  }
});

app.put('/api/trails/:id', async (req, res) => {
  try {
    const updatedTrail = await Trail.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(updatedTrail);
  } catch (err) {
    res.status(400).json({ error: "Erro ao atualizar" });
  }
});

// NOVO: Rota para Avaliação (Rating)
app.post('/api/trails/:id/rate', async (req, res) => {
  try {
    const { rating } = req.body;
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: "Trilho não encontrado" });

    // Lógica: atualiza a nota do trilho
    trail.rating = rating; 
    await trail.save();
    res.json(trail);
  } catch (err) {
    res.status(400).json({ error: "Erro ao avaliar trilho" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));