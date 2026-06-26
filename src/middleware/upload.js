const multer = require('multer')
const path   = require('path')
const fs     = require('fs')

// Tentukan folder tujuan berdasarkan jenis surat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const jenis  = req.baseUrl.includes('surat-masuk') ? 'surat_masuk' : 'surat_keluar'
    const folder = path.join(__dirname, '../../uploads', jenis)

    // Buat folder jika belum ada
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true })
    }

    cb(null, folder)
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext       = path.extname(file.originalname)
    const nama      = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .toLowerCase()

    cb(null, `${nama}_${timestamp}${ext}`)
  }
})

// Filter hanya file PDF dan DOC/DOCX
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Hanya file PDF, DOC, atau DOCX yang diizinkan.'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }  // Maksimal 5 MB
})

module.exports = upload