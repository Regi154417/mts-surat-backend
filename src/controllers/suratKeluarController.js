const db = require('../config/database')
const fs = require('fs')
const path = require('path')

// ─── GET SEMUA SURAT KELUAR ────────────────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT sk.*, u.nama AS dibuat_oleh
      FROM surat_keluar sk
      LEFT JOIN users u ON sk.created_by = u.id
      WHERE 1=1
    `
    const params = []

    if (search) {
      query += ' AND (sk.nomor_surat LIKE ? OR sk.tujuan LIKE ? OR sk.perihal LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status) {
      query += ' AND sk.status_persetujuan = ?'
      params.push(status)
    }

    query += ' ORDER BY sk.tanggal_surat DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))

    const [rows] = await db.query(query, params)

    let countQuery = 'SELECT COUNT(*) AS total FROM surat_keluar WHERE 1=1'
    const countParams = []
    if (search) {
      countQuery += ' AND (nomor_surat LIKE ? OR tujuan LIKE ? OR perihal LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      countQuery += ' AND status_persetujuan = ?'
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
    console.error('Get surat keluar error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── GET DETAIL SURAT KELUAR ───────────────────────────────────────────────────
const getById = async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await db.query(
      `SELECT sk.*, u.nama AS dibuat_oleh
       FROM surat_keluar sk
       LEFT JOIN users u ON sk.created_by = u.id
       WHERE sk.id = ? LIMIT 1`,
      [id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan.' })
    }

    return res.status(200).json({ success: true, data: rows[0] })
  } catch (err) {
    console.error('Get surat keluar by id error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── TAMBAH SURAT KELUAR ───────────────────────────────────────────────────────
const create = async (req, res) => {
  const { nomor_surat, tanggal_surat, tujuan, perihal } = req.body

  if (!nomor_surat || !tanggal_surat || !tujuan || !perihal) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' })
  }

  try {
    const filePath = req.file ? `/uploads/surat_keluar/${req.file.filename}` : null

    const [result] = await db.query(
      `INSERT INTO surat_keluar
        (nomor_surat, tanggal_surat, tujuan, perihal, file_path, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nomor_surat, tanggal_surat, tujuan, perihal, filePath, req.user.id]
    )

    return res.status(201).json({
      success: true,
      message: 'Surat keluar berhasil ditambahkan, menunggu persetujuan kepala sekolah.',
      data: { id: result.insertId }
    })
  } catch (err) {
    console.error('Create surat keluar error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── UPDATE SURAT KELUAR ───────────────────────────────────────────────────────
const update = async (req, res) => {
  const { id } = req.params
  const { nomor_surat, tanggal_surat, tujuan, perihal } = req.body

  try {
    const [existing] = await db.query('SELECT * FROM surat_keluar WHERE id = ? LIMIT 1', [id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan.' })
    }

    let filePath = existing[0].file_path

    if (req.file) {
      if (filePath) {
        const oldPath = path.join(__dirname, '../..', filePath)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      filePath = `/uploads/surat_keluar/${req.file.filename}`
    }

    await db.query(
      `UPDATE surat_keluar
       SET nomor_surat = ?, tanggal_surat = ?, tujuan = ?, perihal = ?, file_path = ?
       WHERE id = ?`,
      [
        nomor_surat || existing[0].nomor_surat,
        tanggal_surat || existing[0].tanggal_surat,
        tujuan || existing[0].tujuan,
        perihal || existing[0].perihal,
        filePath,
        id
      ]
    )

    return res.status(200).json({ success: true, message: 'Surat keluar berhasil diperbarui.' })
  } catch (err) {
    console.error('Update surat keluar error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

// ─── HAPUS SURAT KELUAR ────────────────────────────────────────────────────────
const remove = async (req, res) => {
  const { id } = req.params
  try {
    const [existing] = await db.query('SELECT * FROM surat_keluar WHERE id = ? LIMIT 1', [id])
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Surat keluar tidak ditemukan.' })
    }

    if (existing[0].file_path) {
      const filePath = path.join(__dirname, '../..', existing[0].file_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }

    await db.query('DELETE FROM surat_keluar WHERE id = ?', [id])

    return res.status(200).json({ success: true, message: 'Surat keluar berhasil dihapus.' })
  } catch (err) {
    console.error('Delete surat keluar error:', err)
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' })
  }
}

module.exports = { getAll, getById, create, update, remove }