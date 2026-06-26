const db = require('../config/database')

// ─── GET SEMUA DISPOSISI ───────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { status } = req.query

    let query = `
      SELECT d.*, sm.nomor_surat, sm.perihal, sm.pengirim, u.nama AS dikirim_oleh_nama
      FROM disposisi d
      JOIN surat_masuk sm ON d.surat_masuk_id = sm.id
      LEFT JOIN users u ON d.dikirim_oleh = u.id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ' AND d.status = ?'
      params.push(status)
    }

    query += ' ORDER BY d.created_at DESC'

    const [rows] = await db.query(query, params)
    return res.status(200).json({ success: true, data: rows })
  } catch (err) {
    console.error('Get disposisi error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── GET DETAIL DISPOSISI (+ RIWAYAT) ──────────────────────────────────────────
const getById = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(
      `SELECT d.*, sm.nomor_surat, sm.perihal, sm.pengirim, sm.file_path, u.nama AS dikirim_oleh_nama
       FROM disposisi d
       JOIN surat_masuk sm ON d.surat_masuk_id = sm.id
       LEFT JOIN users u ON d.dikirim_oleh = u.id
       WHERE d.id = ? LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan.' })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('Get disposisi by id error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── KIRIM DISPOSISI BARU (ADMIN) ──────────────────────────────────────────────
const create = async (req, res) => {
  const { surat_masuk_id, arahan } = req.body

  if (!surat_masuk_id) {
    return res.status(400).json({ success: false, message: 'Surat masuk wajib dipilih.' })
  }

  try {
    const [surat] = await db.query('SELECT * FROM surat_masuk WHERE id = ? LIMIT 1', [surat_masuk_id])
    if (surat.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan.' })
    }

    const today = new Date().toISOString().slice(0, 10)

    const [result] = await db.query(
      `INSERT INTO disposisi (surat_masuk_id, dikirim_oleh, arahan, status, tanggal_kirim)
       VALUES (?, ?, ?, 'menunggu', ?)`,
      [surat_masuk_id, req.user.id, arahan || null, today]
    )

    // Sinkronkan status pada surat masuk terkait
    await db.query(
      'UPDATE surat_masuk SET status_disposisi = ? WHERE id = ?',
      ['menunggu', surat_masuk_id]
    )

    return res.status(201).json({
      success: true,
      message: 'Disposisi berhasil dikirim.',
      data: { id: result.insertId }
    })
  } catch (err) {
    console.error('Create disposisi error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── ISI ARAHAN / UBAH STATUS (KEPALA SEKOLAH) ─────────────────────────────────
const update = async (req, res) => {
  const { id } = req.params
  const { arahan, status } = req.body

  const validStatus = ['menunggu', 'diproses', 'selesai']
  if (status && !validStatus.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status tidak valid.' })
  }

  try {
    const [existing] = await db.query('SELECT * FROM disposisi WHERE id = ? LIMIT 1', [id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Disposisi tidak ditemukan.' })
    }

    const tanggalSelesai = status === 'selesai'
      ? new Date().toISOString().slice(0, 10)
      : existing[0].tanggal_selesai

    await db.query(
      `UPDATE disposisi
       SET arahan = ?, status = ?, tanggal_selesai = ?
       WHERE id = ?`,
      [
        arahan !== undefined ? arahan : existing[0].arahan,
        status || existing[0].status,
        tanggalSelesai,
        id
      ]
    )

    // Sinkronkan status pada surat masuk terkait
    if (status) {
      await db.query(
        'UPDATE surat_masuk SET status_disposisi = ? WHERE id = ?',
        [status, existing[0].surat_masuk_id]
      )
    }

    return res.status(200).json({ success: true, message: 'Disposisi berhasil diperbarui.' })
  } catch (err) {
    console.error('Update disposisi error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getAll, getById, create, update }