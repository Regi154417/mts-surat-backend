const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ======================================================
// CORS
// ======================================================

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Mengizinkan Postman, mobile app, atau request tanpa Origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin tidak diizinkan oleh CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// STATIC FILE
// ======================================================

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend Sistem Administrasi Surat MTs Al-Muttaqin berjalan.',
    version: '1.0.0'
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/surat-masuk', require('./routes/suratMasukRoutes'));
app.use('/api/surat-keluar', require('./routes/suratKeluarRoutes'));
app.use('/api/disposisi', require('./routes/disposisiRoutes'));
app.use('/api/persetujuan', require('./routes/persetujuanRoutes'));
app.use('/api/arsip', require('./routes/arsipRoutes'));
app.use('/api/laporan', require('./routes/laporanRoutes'));

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`
  });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.'
  });
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan pada port ${PORT}`);
});