const express        = require('express')
const router         = express.Router()
const authController = require('../controllers/authController')
const { verifyToken }  = require('../middleware/auth')

// POST /api/auth/login — tidak perlu token
router.post('/login', authController.login)

// GET /api/auth/profile — butuh token
router.get('/profile', verifyToken, authController.getProfile)

// PUT /api/auth/ganti-password — butuh token
router.put('/ganti-password', verifyToken, authController.gantiPassword)

module.exports = router