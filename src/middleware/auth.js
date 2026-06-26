const jwt = require('jsonwebtoken')
require('dotenv').config()

// Middleware verifikasi token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
    })
  }

  // Format header: "Bearer <token>"
  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid.'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded  // { id, username, role }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Sesi telah berakhir. Silakan login kembali.'
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid.'
    })
  }
}

module.exports = { verifyToken }