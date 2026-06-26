const db = require('../config/database')

// ─── GET SEMUA ARSIP (GABUNGAN SURAT MASUK + SURAT KELUAR) ────────────────────
const getAll = async (req, res) => {
  try {
    const { jenis, keyword, tanggal_mulai, tanggal_akhir } = req.query
    let results = []

    // Surat masuk
    if (!jenis || jenis === 'masuk') {
      let q = `
        SELECT
          id, nomor_surat, tanggal_surat,
          pengirim AS pihak, perihal, file_path,
          'masuk' AS jenis, status_disposisi AS status, created_at
        FROM surat_masuk
        WHERE 1=1
      `
      const p = []
      if (keyword) {
        q += ' AND (nomor_surat LIKE ? OR pengirim LIKE ? OR perihal LIKE ?)'
        p.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      if (tanggal_mulai && tanggal_akhir) {
        q += ' AND tanggal_surat BETWEEN ? AND ?'
        p.push(tanggal_mulai, tanggal_akhir)
      }
      const [rows] = await db.query(q, p)
      results = results.concat(rows)
    }

    // Surat keluar
    if (!jenis || jenis === 'keluar') {
      let q = `
        SELECT
          id, nomor_surat, tanggal_surat,
          tujuan AS pihak, perihal, file_path,
          'keluar' AS jenis, status_persetujuan AS status, created_at
        FROM surat_keluar
        WHERE 1=1
      `
      const p = []
      if (keyword) {
        q += ' AND (nomor_surat LIKE ? OR tujuan LIKE ? OR perihal LIKE ?)'
        p.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }
      if (tanggal_mulai && tanggal_akhir) {
        q += ' AND tanggal_surat BETWEEN ? AND ?'
        p.push(tanggal_mulai, tanggal_akhir)
      }
      const [rows] = await db.query(q, p)
      results = results.concat(rows)
    }

    // Urutkan gabungan berdasarkan tanggal surat terbaru
    results.sort((a, b) => new Date(b.tanggal_surat) - new Date(a.tanggal_surat))

    return res.status(200).json({ success: true, data: results })
  } catch (err) {
    console.error('Get arsip error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getAll }