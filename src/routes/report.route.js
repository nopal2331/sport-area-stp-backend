const express = require("express");
const {
  downloadReport,
  getAllReports,
  getReportById,
  getUserReports,
  deleteReport,
  generatePDFwithPuppeteer,
} = require("../controllers/report.controller");

const {
  validateGenerateReport,
  validateDownloadReport,
  validateGetReportById,
  validateDeleteReport,
} = require("../middlewares/report.middleware");

const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

// 🔒 Semua route menggunakan authMiddleware

// [POST] Buat laporan dari booking (hanya jika booking sudah approved)
router.post(
  "/generate-pdf/:bookingId",
  authMiddleware,
  validateGenerateReport,
  generatePDFwithPuppeteer
);

// [GET] Unduh laporan berdasarkan ID
router.get(
  "/download/:id",
  authMiddleware,
  validateDownloadReport,
  downloadReport
);

// [GET] Ambil semua laporan (admin bisa lihat semua)
router.get("/", authMiddleware, getAllReports);

// [GET] Ambil laporan berdasarkan ID
router.get("/:id", authMiddleware, validateGetReportById, getReportById);

// [GET] Ambil semua laporan milik user yang login
router.get("/me/all", authMiddleware, getUserReports);

// [DELETE] Hapus laporan (oleh pemilik atau admin)
router.delete("/:id", authMiddleware, validateDeleteReport, deleteReport);

module.exports = router;
