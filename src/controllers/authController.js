const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const db     = require('../config/database')
require('dotenv').config()

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body

  // Validasi input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan password wajib diisi.'
    })
  }

  try {
    // Cari user berdasarkan username
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    )

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      })
    }

    const user = rows[0]

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      })
    }

    // Buat JWT token
    const token = jwt.sign(
      {
        id:       user.id,
        username: user.username,
        role:     user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    )

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: {
          id:       user.id,
          nama:     user.nama,
          username: user.username,
          role:     user.role
        }
      }
    })

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    })
  }
}

// ─── GET PROFIL USER YANG SEDANG LOGIN ───────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nama, username, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.'
      })
    }

    return res.status(200).json({
      success: true,
      data: rows[0]
    })

  } catch (err) {
    console.error('Get profile error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    })
  }
}

// ─── GANTI PASSWORD ───────────────────────────────────────────────────────────
const gantiPassword = async (req, res) => {
  const { password_lama, password_baru } = req.body

  if (!password_lama || !password_baru) {
    return res.status(400).json({
      success: false,
      message: 'Password lama dan password baru wajib diisi.'
    })
  }

  if (password_baru.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal 6 karakter.'
    })
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.'
      })
    }

    const user = rows[0]

    console.log("===== LOGIN DEBUG =====");
    console.log("User:", user);
    console.log("Keys:", Object.keys(user));
    console.log("user.password:", user.password);
    console.log("user.PASSWORD:", user.PASSWORD);

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("isMatch:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak sesuai.'
      })
    }

    // Hash password baru
    const hashedBaru = await bcrypt.hash(password_baru, 10)

    await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedBaru, req.user.id]
    )

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diubah.'
    })

  } catch (err) {
    console.error('Ganti password error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    })
  }
}

module.exports = { login, getProfile, gantiPassword }