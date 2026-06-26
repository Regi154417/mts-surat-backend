const express = require('express')
const router = express.Router()
const controller = require('../controllers/laporanController')
const { verifyToken } = require('../middleware/auth')

router.get('/', verifyToken, controller.getLaporan)

module.exports = router