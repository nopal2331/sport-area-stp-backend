import prisma from "../prisma/client.js";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const compileTemplate = (html, data) => {
  return html.replace(/{{(.*?)}}/g, (_, key) => data[key.trim()] || "");
};

export const generatePDFwithPuppeteer = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, admin: true },
    });

    if (!booking || booking.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Booking tidak valid atau belum disetujui" });
    }
    const templatePath = path.join(
      process.cwd(),
      "views",
      "report-template.html"
    );

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "Template HTML tidak ditemukan" });
    }

    const html = fs.readFileSync(templatePath, "utf8");

    const data = {
      tanggalCetak: new Date().toLocaleDateString("id-ID"),
      bookingId: booking.id,
      nama: booking.user.name,
      phone: booking.user.phone || "-",
      lapangan:
        booking.field_type === "basket" ? "Lapangan Basket" : "Lapangan Futsal",
      lapanganId: booking.field_type === "basket" ? "LAP-B" : "LAP-F",
      disetujuiOleh: booking.admin.name,
      tanggalBooking: new Date(booking.date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      jam: booking.time_slot,
    };

    const compiledHTML = compileTemplate(html, data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // ✅ Tambahkan waitUntil: 'networkidle0' agar gambar sempat termuat
    await page.setContent(compiledHTML, { waitUntil: "networkidle0" });

    const uploadDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `LAP-${booking.field_type.toUpperCase()}-${
      booking.id
    }-${new Date().getTime()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = path.join("uploads", "reports", fileName);

    await page.pdf({
      path: filePath,
      width: "10.67in",
      height: "6.25in",
      printBackground: true,
    });
    await browser.close();

    // Simpan ke database
    await prisma.report.upsert({
      where: { booking_id: bookingId },
      update: {
        file_name: fileName,
        file_path: relativePath,
        generated_at: new Date(),
      },
      create: {
        booking_id: bookingId,
        file_name: fileName,
        file_path: relativePath,
      },
    });

    res.download(filePath, fileName);
  } catch (err) {
    console.error("Gagal generate PDF:", err.message);
    res.status(500).json({
      message: "Gagal generate laporan PDF",
      error: err.message,
    });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.reportId },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    const filePath = path.join(process.cwd(), report.file_path);

    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File laporan tidak ditemukan",
      });
    }

    // Set headers untuk download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.file_name}"`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { booking_id } = req.query;
    const where = {};

    if (booking_id) {
      where.booking_id = parseInt(booking_id);
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { generated_at: "desc" },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            admin: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.reportId },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            admin: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    res.json({ report });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};

export const getUserReports = async (req, res) => {
  try {
    const user_id = req.user.id;

    const reports = await prisma.report.findMany({
      where: {
        booking: {
          user_id,
        },
      },
      orderBy: { generated_at: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            field_type: true,
            date: true,
            time_slot: true,
            status: true,
          },
        },
      },
    });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.reportId },
    });

    const filePath = path.join(process.cwd(), report.file_path);

    // Hapus file jika ada
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Hapus dari database
    await prisma.report.delete({
      where: { id: req.reportId },
    });

    res.json({ message: "Laporan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({
      message: "Terjadi kesalahan",
      error: err.message,
    });
  }
};
