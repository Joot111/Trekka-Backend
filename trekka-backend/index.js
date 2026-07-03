const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- LIGAÇÃO AO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado ao MongoDB Atlas"))
  .catch(err => console.error("Erro ao conectar:", err));

// --- MODELOS DE DADOS ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const TrailSchema = new mongoose.Schema({
    name: String,
    description: String,
    distanceMeters: Number,
    durationSeconds: Number,
    createdAt: { type: Number, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: [{
        latitude: Number,
        longitude: Number,
        timestamp: Number,
        orderIndex: Number
    }]
});

const User = mongoose.model('User', UserSchema);
const Trail = mongoose.model('Trail', TrailSchema);

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // Nota: Num projeto real, deves encriptar a password com bcryptjs aqui
        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ token: "token-temporario-123", user: { id: user._id, name, email } });
    } catch (err) {
        res.status(400).json({ error: "Erro ao criar conta" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        res.json({ token: "token-temporario-123", user: { id: user._id, name: user.name, email: user.email } });
    } else {
        res.status(401).json({ error: "Credenciais inválidas" });
    }
});

// --- ROTAS DE TRILHOS ---

app.get('/api/trails', async (req, res) => {
    const trails = await Trail.find().sort({ createdAt: -1 });
    res.json(trails);
});

app.post('/api/trails', async (req, res) => {
    try {
        const trail = new Trail(req.body);
        await trail.save();
        res.status(201).json(trail);
    } catch (err) {
        res.status(400).json({ error: "Erro ao salvar trilho" });
    }
});

app.delete('/api/trails/:id', async (req, res) => {
    await Trail.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor a correr na porta ${PORT}`));