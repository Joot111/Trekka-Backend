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
  numRatings: { type: Number, default: 0 },
  ratedBy: { type: [String], default: [] }, // NOVO: Guarda quem já votou
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
    const { createdAt, userId } = req.body;
    // Procura se já existe um trilho com o mesmo timestamp para este user
    let trail = await Trail.findOne({ createdAt, userId });

    if (trail) {
      // Se já existe, apenas atualizamos (evita duplicados)
      trail = await Trail.findByIdAndUpdate(trail._id, req.body, { new: true });
      return res.status(200).json(trail);
    }

    // Se não existe, criamos um novo
    const newTrail = new Trail(req.body);
    await newTrail.save();
    res.status(201).json(newTrail);
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
    const { rating, userId } = req.body;
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: "Trilho não encontrado" });

    // --- PROTEÇÃO PARA DADOS ANTIGOS ---
    if (!trail.ratedBy) {
      trail.ratedBy = [];
    }

    if (trail.ratedBy.includes(userId)) {
      return res.status(403).json({ error: "Já avaliou este trilho" });
    }

    // Cálculos de média...
    const totalStars = (trail.rating * (trail.numRatings || 0)) + rating;
    trail.numRatings = (trail.numRatings || 0) + 1;
    trail.rating = totalStars / trail.numRatings;

    trail.ratedBy.push(userId);

    await trail.save();
    res.json(trail);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));