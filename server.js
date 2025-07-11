const app = require("./src/app");
const cron = require("node-cron");
const prisma = require("./src/prisma/client");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

// Cron: jalan setiap menit
cron.schedule("* * * * *", async () => {
  const now = new Date();
  console.log("🕒 Running cron job at", now.toISOString());

  try {
    // Ambil semua booking (approved, pending, rejected)
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ["approved", "pending", "rejected"],
        },
      },
    });

    for (const booking of bookings) {
      if (
        !booking.date ||
        !booking.time_slot ||
        !booking.time_slot.includes(" - ")
      ) {
        console.warn(
          `⚠️ Booking ID ${booking.id} memiliki data tidak valid (date atau time_slot).`
        );
        continue;
      }

      // Ambil jam mulai dari time_slot
      const [startTime] = booking.time_slot.split(" - ");
      const [hour, minute] = startTime.split(":").map(Number);

      // Ambil tanggal (tanpa waktu) dari booking.date
      const bookingDateOnly = new Date(booking.date);
      const bookingDateTime = new Date(
        bookingDateOnly.getFullYear(),
        bookingDateOnly.getMonth(),
        bookingDateOnly.getDate(),
        hour,
        minute,
        0,
        0
      );

      if (isNaN(bookingDateTime.getTime())) {
        console.warn(`⛔ Booking ID ${booking.id} memiliki waktu tidak valid.`);
        continue;
      }

      // Hapus booking hanya jika waktunya sudah lewat
      if (bookingDateTime < now) {
        // Hapus report terlebih dahulu (jika ada)
        await prisma.report.deleteMany({
          where: { booking_id: booking.id },
        });

        await prisma.booking.delete({
          where: { id: booking.id },
        });

        console.log(
          `✅ Booking ID ${booking.id} (${booking.status}) berhasil dihapus karena sudah lewat waktunya`
        );
      } else {
        console.log(
          `⏳ Booking ID ${booking.id} (${booking.status}) masih aktif, belum waktunya dihapus`
        );
      }
    }
  } catch (err) {
    console.error("❌ Gagal menjalankan cron job:", err);
  }
});
