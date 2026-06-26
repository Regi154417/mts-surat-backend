const express = require('express')
const router = express.Router()
const controller = require('../controllers/suratKeluarController')
const { verifyToken } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roleCheck')
const upload = require('../middleware/upload')

// Semua role yang login boleh melihat surat keluar
router.get('/', verifyToken, controller.getAll)
router.get('/:id', verifyToken, controller.getById)

// Hanya admin yang boleh tambah, ubah, hapus surat keluar
router.post('/', verifyToken, allowRoles('admin'), upload.single('file'), controller.create)
router.put('/:id', verifyToken, allowRoles('admin'), upload.single('file'), controller.update)
router.delete('/:id', verifyToken, allowRoles('admin'), controller.remove)

module.exports = router