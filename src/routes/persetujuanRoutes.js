const express = require('express')
const router = express.Router()
const controller = require('../controllers/persetujuanController')
const { verifyToken } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roleCheck')

router.get('/', verifyToken, controller.getAll)
router.get('/:id', verifyToken, controller.getById)

// Hanya kepala sekolah yang menyetujui / menolak surat keluar
router.post('/', verifyToken, allowRoles('kepala_sekolah'), controller.create)

module.exports = router