const db = require('../config/database')
const fs = require('fs')
const path = require('path')

// ─── GET SEMUA SURAT MASUK ────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT sm.*, u.nama AS dibuat_oleh
      FROM surat_masuk sm
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `
    const params = []

    if (search) {
      query += ' AND (sm.nomor_surat LIKE ? OR sm.pengirim LIKE ? OR sm.perihal LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status) {
      query += ' AND sm.status_disposisi = ?'
      params.push(status)
    }

    query += ' ORDER BY sm.tanggal_terima DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const [rows] = await db.query(query, params)

    // Hitung total data untuk pagination
    let countQuery = 'SELECT COUNT(*) AS total FROM surat_masuk WHERE 1=1'
    const countParams = []
    if (search) {
      countQuery += ' AND (nomor_surat LIKE ? OR pengirim LIKE ? OR perihal LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      countQuery += ' AND status_disposisi = ?'
      countParams.push(status)
    }
    const [countRows] = await db.query(countQuery, countParams)

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: countRows[0].total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(countRows[0].total / limit)
      }
    })
  } catch (err) {
    console.error('Get surat masuk error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── GET DETAIL SURAT MASUK ────────────────────────────────────────────────────
const getById = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(
      `SELECT sm.*, u.nama AS dibuat_oleh
       FROM surat_masuk sm
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.id = ? LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan.' })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('Get surat masuk by id error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── TAMBAH SURAT MASUK ────────────────────────────────────────────────────────
const create = async (req, res) => {
  const { nomor_surat, tanggal_surat, tanggal_terima, pengirim, perihal } = req.body

  if (!nomor_surat || !tanggal_surat || !tanggal_terima || !pengirim || !perihal) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' })
  }

  try {
    const filePath = req.file ? `/uploads/surat_masuk/${req.file.filename}` : null

    const [result] = await db.query(
      `INSERT INTO surat_masuk
        (nomor_surat, tanggal_surat, tanggal_terima, pengirim, perihal, file_path, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nomor_surat, tanggal_surat, tanggal_terima, pengirim, perihal, filePath, req.user.id]
    )

    return res.status(201).json({
      success: true,
      message: 'Surat masuk berhasil ditambahkan.',
      data: { id: result.insertId }
    })
  } catch (err) {
    console.error('Create surat masuk error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── UPDATE SURAT MASUK ────────────────────────────────────────────────────────
const update = async (req, res) => {
  const { id } = req.params
  const { nomor_surat, tanggal_surat, tanggal_terima, pengirim, perihal } = req.body

  try {
    const [existing] = await db.query('SELECT * FROM surat_masuk WHERE id = ? LIMIT 1', [id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan.' })
    }

    let filePath = existing[0].file_path

    if (req.file) {
      // Hapus file lama jika ada penggantian file baru
      if (filePath) {
        const oldPath = path.join(__dirname, '../..', filePath)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      filePath = `/uploads/surat_masuk/${req.file.filename}`
    }

    await db.query(
      `UPDATE surat_masuk
       SET nomor_surat = ?, tanggal_surat = ?, tanggal_terima = ?, pengirim = ?, perihal = ?, file_path = ?
       WHERE id = ?`,
      [
        nomor_surat || existing[0].nomor_surat,
        tanggal_surat || existing[0].tanggal_surat,
        tanggal_terima || existing[0].tanggal_terima,
        pengirim || existing[0].pengirim,
        perihal || existing[0].perihal,
        filePath,
        id
      ]
    )

    return res.status(200).json({ success: true, message: 'Surat masuk berhasil diperbarui.' })
  } catch (err) {
    console.error('Update surat masuk error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── HAPUS SURAT MASUK ─────────────────────────────────────────────────────────
const remove = async (req, res) => {
  const { id } = req.params
  try {
    const [existing] = await db.query('SELECT * FROM surat_masuk WHERE id = ? LIMIT 1', [id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat masuk tidak ditemukan.' })
    }

    if (existing[0].file_path) {
      const filePath = path.join(__dirname, '../..', existing[0].file_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await db.query('DELETE FROM surat_masuk WHERE id = ?', [id])

    return res.status(200).json({ success: true, message: 'Surat masuk berhasil dihapus.' })
  } catch (err) {
    console.error('Delete surat masuk error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getAll, getById, create, update, remove }