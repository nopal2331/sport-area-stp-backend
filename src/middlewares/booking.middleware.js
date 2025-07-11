import prisma from "../prisma/client.js";

export const validateCreateBooking = async (req, res, next) => {
  const { field_type, date, time_slot } = req.body;

  // Validasi field_type
  if (!field_type || !["basket", "futsal"].includes(field_type)) {
    return res.status(400).json({
      message: "Field type harus 'basket' atau 'futsal'",
    });
  }

  // Validasi date
  if (!date) {
    return res.status(400).json({
      message: "Tanggal tidak boleh kosong",
    });
  }

  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime())) {
    return res.status(400).json({
      message: "Format tanggal tidak valid",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) {
    return res.status(400).json({
      message: "Tidak dapat membuat booking untuk tanggal yang sudah lewat",
    });
  }

  // Validasi time_slot
  const validTimeSlots = [
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00",
  ];

  if (!time_slot || !validTimeSlots.includes(time_slot)) {
    return res.status(400).json({
      message: "Time slot tidak valid. Pilihan: " + validTimeSlots.join(", "),
    });
  }

  req.validatedBooking = {
    field_type,
    date: bookingDate.toISOString(),
    time_slot,
  };

  next();
};

export const validateGetBookingById = async (req, res, next) => {
  const bookingId = parseInt(req.params.id);

  if (isNaN(bookingId)) {
    return res.status(400).json({ message: "ID booking tidak valid" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    // Cek akses: user hanya bisa lihat booking sendiri, admin bisa lihat semua
    const isOwner = req.user.id === booking.user_id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik booking atau admin yang dapat mengakses",
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

export const validateUpdateBookingStatus = async (req, res, next) => {
  const bookingId = parseInt(req.params.id);
  const { status } = req.body;

  if (isNaN(bookingId)) {
    return res.status(400).json({ message: "ID booking tidak valid" });
  }

  if (!status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Status harus 'approved' atau 'rejected'",
    });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Hanya booking dengan status 'pending' yang dapat diubah",
      });
    }

    req.bookingId = bookingId;
    req.validatedStatusUpdate = { status };
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};

export const validateUpdateBooking = async (req, res, next) => {
  const bookingId = parseInt(req.params.id);
  const { field_type, date, time_slot } = req.body;

  if (isNaN(bookingId)) {
    return res.status(400).json({ message: "ID booking tidak valid" });
  }

  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    // Hanya booking pending yang bisa diupdate
    if (existingBooking.status !== "pending") {
      return res.status(400).json({
        message: "Hanya booking dengan status 'pending' yang dapat diperbarui",
      });
    }

    const updateData = {};

    if (field_type !== undefined) {
      if (!["basket", "futsal"].includes(field_type)) {
        return res.status(400).json({
          message: "Field type harus 'basket' atau 'futsal'",
        });
      }
      updateData.field_type = field_type;
    }

    if (date !== undefined) {
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({
          message: "Format tanggal tidak valid",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        return res.status(400).json({
          message: "Tidak dapat mengatur tanggal yang sudah lewat",
        });
      }

      updateData.date = bookingDate.toISOString();
    }

    if (time_slot !== undefined) {
      const validTimeSlots = [
        "09:00 - 10:00",
        "10:00 - 11:00",
        "11:00 - 12:00",
        "12:00 - 13:00",
        "13:00 - 14:00",
        "14:00 - 15:00",
        "15:00 - 16:00",
        "16:00 - 17:00",
        "17:00 - 18:00",
        "18:00 - 19:00",
      ];

      if (!validTimeSlots.includes(time_slot)) {
        return res.status(400).json({
          message:
            "Time slot tidak valid. Pilihan: " + validTimeSlots.join(", "),
        });
      }

      updateData.time_slot = time_slot;
    }

    // Cek konflik booking jika ada perubahan waktu atau tanggal
    if (updateData.date || updateData.time_slot || updateData.field_type) {
      const checkDate = updateData.date || existingBooking.date;
      const checkTimeSlot = updateData.time_slot || existingBooking.time_slot;
      const checkFieldType =
        updateData.field_type || existingBooking.field_type;

      const conflictBooking = await prisma.booking.findFirst({
        where: {
          id: { not: bookingId },
          field_type: checkFieldType,
          date: new Date(checkDate),
          time_slot: checkTimeSlot,
          status: { in: ["pending", "approved"] },
        },
      });

      if (conflictBooking) {
        return res.status(400).json({
          message: "Waktu booking sudah tidak tersedia",
        });
      }
    }

    req.bookingId = bookingId;
    req.updateData = updateData;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Validasi gagal",
      error: err.message,
    });
  }
};

export const validateDeleteBooking = async (req, res, next) => {
  const bookingId = parseInt(req.params.id);

  if (isNaN(bookingId)) {
    return res.status(400).json({ message: "ID booking tidak valid" });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking tidak ditemukan" });
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

export const validateAdminAccess = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Hanya admin yang dapat mengakses fitur ini",
    });
  }
  next();
};
