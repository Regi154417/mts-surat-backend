const express = require('express')
const router = express.Router()
const controller = require('../controllers/disposisiController')
const { verifyToken } = require('../middleware/auth')
const { allowRoles } = require('../middleware/roleCheck')

router.get('/', verifyToken, controller.getAll)
router.get('/:id', verifyToken, controller.getById)

// Hanya admin yang mengirim disposisi
router.post('/', verifyToken, allowRoles('admin'), controller.create)

// Hanya kepala sekolah yang mengisi arahan & mengubah status
router.put('/:id', verifyToken, allowRoles('kepala_sekolah'), controller.update)

module.exports = router