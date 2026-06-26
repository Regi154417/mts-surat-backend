const db = require('../config/database')

// ─── GET SEMUA DATA PERSETUJUAN ────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { status } = req.query

    let query = `
      SELECT p.*, sk.nomor_surat, sk.tujuan, sk.perihal, u.nama AS disetujui_oleh_nama
      FROM persetujuan_surat_keluar p
      JOIN surat_keluar sk ON p.surat_keluar_id = sk.id
      LEFT JOIN users u ON p.disetujui_oleh = u.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ' AND p.status = ?'
      params.push(status)
    }

    query += ' ORDER BY p.created_at DESC'

    const [rows] = await db.query(query, params)
    return res.status(200).json({ success: true, data: rows })
  } catch (err) {
    console.error('Get persetujuan error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── GET DETAIL PERSETUJUAN ─────────────────────────────────────────────────────
const getById = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(
      `SELECT p.*, sk.nomor_surat, sk.tujuan, sk.perihal, sk.file_path, u.nama AS disetujui_oleh_nama
       FROM persetujuan_surat_keluar p
       JOIN surat_keluar sk ON p.surat_keluar_id = sk.id
       LEFT JOIN users u ON p.disetujui_oleh = u.id
       WHERE p.id = ? LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data persetujuan tidak ditemukan.' })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('Get persetujuan by id error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── SETUJUI / TOLAK SURAT KELUAR (KEPALA SEKOLAH) ─────────────────────────────
const create = async (req, res) => {
  const { surat_keluar_id, status, catatan } = req.body

  if (!surat_keluar_id || !status) {
    return res.status(400).json({ success: false, message: 'Surat keluar dan status keputusan wajib diisi.' })
  }

  if (!['disetujui', 'ditolak'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status harus disetujui atau ditolak.' })
  }

  try {
    const [surat] = await db.query('SELECT * FROM surat_keluar WHERE id = ? LIMIT 1', [surat_keluar_id])
    if (surat.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan.' })
    }

    const today = new Date().toISOString().slice(0, 10)

    const [result] = await db.query(
      `INSERT INTO persetujuan_surat_keluar
        (surat_keluar_id, disetujui_oleh, status, catatan, tanggal_keputusan)
       VALUES (?, ?, ?, ?, ?)`,
      [surat_keluar_id, req.user.id, status, catatan || null, today]
    )

    // Sinkronkan status & catatan pada surat keluar
    await db.query(
      'UPDATE surat_keluar SET status_persetujuan = ?, catatan_kepsek = ? WHERE id = ?',
      [status, catatan || null, surat_keluar_id]
    )

    return res.status(201).json({
      success: true,
      message: `Surat keluar berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}.`,
      data: { id: result.insertId }
    })
  } catch (err) {
    console.error('Create persetujuan error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getAll, getById, create }