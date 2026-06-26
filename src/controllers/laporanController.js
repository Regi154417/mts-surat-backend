const db = require('../config/database')

// ─── GENERATE LAPORAN SURAT BERDASARKAN PERIODE ────────────────────────────────
const getLaporan = async (req, res) => {
  const { jenis = 'semua', tanggal_mulai, tanggal_akhir } = req.query

  if (!tanggal_mulai || !tanggal_akhir) {
    return res.status(400).json({
      success: false,
      message: 'Periode tanggal mulai dan tanggal akhir wajib diisi.'
    })
  }

  try {
    let data = []

    if (jenis === 'masuk' || jenis === 'semua') {
      const [rows] = await db.query(
        `SELECT
           id, nomor_surat, tanggal_surat, tanggal_terima,
           pengirim AS pihak, perihal, status_disposisi AS status,
           'Surat Masuk' AS jenis
         FROM surat_masuk
         WHERE tanggal_surat BETWEEN ? AND ?
         ORDER BY tanggal_surat ASC`,
        [tanggal_mulai, tanggal_akhir]
      )
      data = data.concat(rows)
    }

    if (jenis === 'keluar' || jenis === 'semua') {
      const [rows] = await db.query(
        `SELECT
           id, nomor_surat, tanggal_surat, NULL AS tanggal_terima,
           tujuan AS pihak, perihal, status_persetujuan AS status,
           'Surat Keluar' AS jenis
         FROM surat_keluar
         WHERE tanggal_surat BETWEEN ? AND ?
         ORDER BY tanggal_surat ASC`,
        [tanggal_mulai, tanggal_akhir]
      )
      data = data.concat(rows)
    }

    const ringkasan = {
      total: data.length,
      surat_masuk: data.filter(d => d.jenis === 'Surat Masuk').length,
      surat_keluar: data.filter(d => d.jenis === 'Surat Keluar').length
    }

    return res.status(200).json({
      success: true,
      data,
      ringkasan,
      periode: { tanggal_mulai, tanggal_akhir }
    })
  } catch (err) {
    console.error('Get laporan error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getLaporan }