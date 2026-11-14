require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', service: 'NotesHub API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`NotesHub API running on port ${PORT}`);
            });
        })
        .catch(err => {
            console.error('MongoDB connection failed:', err.message);
            process.exit(1);
        });
}

module.exports = app;
