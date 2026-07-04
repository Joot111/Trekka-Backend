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
    let trail = await Trail.findOne({ createdAt, userId });

    if (trail) {
      // ATUALIZAÇÃO SEGURA: Não sobrepõe ratings nem votantes
      trail.name = req.body.name;
      trail.description = req.body.description;
      trail.isPublic = req.body.isPublic;
      trail.distanceMeters = req.body.distanceMeters;
      trail.durationSeconds = req.body.durationSeconds;
      // Os campos trail.rating, trail.numRatings e trail.ratedBy MANTÊM-SE
      
      await trail.save();
      return res.status(200).json(trail);
    }

    // Criação de novo trilho
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

// Avaliação (Rating) com persistência de votantes
app.post('/api/trails/:id/rate', async (req, res) => {
  try {
    const { rating, userId } = req.body;
    const trail = await Trail.findById(req.params.id);
    if (!trail) return res.status(404).json({ error: "Trilho não encontrado" });

    if (!trail.ratedBy) trail.ratedBy = [];

    if (trail.ratedBy.includes(userId)) {
      return res.status(403).json({ error: "Já avaliou" });
    }

    const newVote = Number(rating);
    const currentRating = Number(trail.rating || 0);
    const currentCount = Number(trail.numRatings || 0);

    const totalStars = (currentRating * currentCount) + newVote;
    trail.numRatings = currentCount + 1;
    trail.rating = totalStars / trail.numRatings;

    trail.ratedBy.push(userId);

    await trail.save();
    res.json(trail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trails/:id', async (req, res) => {
  try {
    await Trail.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: "Erro ao eliminar" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));