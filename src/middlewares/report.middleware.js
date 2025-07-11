import prisma from "../prisma/client.js";

export const validateGenerateReport = async (req, res, next) => {
  const bookingId = parseInt(req.params.bookingId);

  if (isNaN(bookingId)) {
    return res.status(400).json({ message: "ID booking tidak valid" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    // Cek akses: user hanya bisa generate report untuk booking sendiri, admin bisa semua
    const isOwner = req.user.id === booking.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik booking atau admin yang dapat membuat laporan",
      });
    }

    req.bookingId = bookingId;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};

export const validateGetReportById = async (req, res, next) => {
  const reportId = parseInt(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ message: "ID laporan tidak valid" });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        booking: {
          select: { user_id: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Cek akses: user hanya bisa lihat report booking sendiri, admin bisa semua
    const isOwner = req.user.id === report.booking.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik booking atau admin yang dapat mengakses laporan",
      });
    }

    req.reportId = reportId;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};

export const validateDownloadReport = async (req, res, next) => {
  const reportId = parseInt(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ message: "ID laporan tidak valid" });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        booking: {
          select: {
            user_id: true,
            status: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Cek akses: user hanya bisa download report booking sendiri, admin bisa semua
    const isOwner = req.user.id === report.booking.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik booking atau admin yang dapat mengunduh laporan",
      });
    }

    // Pastikan booking sudah approved
    if (report.booking.status !== "approved") {
      return res.status(400).json({
        message:
          "Laporan hanya dapat diunduh untuk booking yang sudah disetujui",
      });
    }

    req.reportId = reportId;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};

export const validateDeleteReport = async (req, res, next) => {
  const reportId = parseInt(req.params.id);

  if (isNaN(reportId)) {
    return res.status(400).json({ message: "ID laporan tidak valid" });
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        booking: {
          select: { user_id: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // Cek akses: user hanya bisa hapus report booking sendiri, admin bisa semua
    const isOwner = req.user.id === report.booking.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik booking atau admin yang dapat menghapus laporan",
      });
    }

    req.reportId = reportId;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};
