import prisma from "../prisma/client.js";

export const validateGetAllUsers = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Hanya admin yang dapat melihat semua user" });
  }
  next();
};

export const validateGetUserById = async (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const isSelf = req.user.id === userId;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        message:
          "Akses ditolak: hanya pemilik akun atau admin yang dapat mengakses data ini",
      });
    }

    req.userId = userId;
    next();
  } catch (err) {
    res.status(500).json({ message: "Validasi gagal", error: err.message });
  }
};

export const validateUpdateUser = async (req, res, next) => {
  const { name, email, password, role, phone } = req.body;
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10,14}$/;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const updateData = {};

    if (name !== undefined) {
      if (name.trim() === "") {
        return res.status(400).json({ message: "Nama tidak boleh kosong" });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Format email tidak valid" });
      }

      const emailUsed = await prisma.user.findUnique({ where: { email } });
      if (emailUsed && emailUsed.id !== userId) {
        return res
          .status(400)
          .json({ message: "Email sudah digunakan user lain" });
      }

      updateData.email = email;
    }

    if (phone !== undefined) {
      if (!phoneRegex.test(phone)) {
        return res
          .status(400)
          .json({ message: "Format nomor Handphone tidak valid (10–14 digit angka)" });
      }

      const phoneUsed = await prisma.user.findUnique({ where: { phone } });
      if (phoneUsed && phoneUsed.id !== userId) {
        return res
          .status(400)
          .json({ message: "Nomor Handphone sudah digunakan user lain" });
      }

      updateData.phone = phone.trim();
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password minimal 6 karakter" });
      }
      updateData.password = password;
    }

    if (role !== undefined) {
      if (!["admin", "user"].includes(role)) {
        return res
          .status(400)
          .json({ message: "Role hanya boleh admin atau user" });
      }
      updateData.role = role;
    }

    req.userId = userId;
    req.updateData = updateData;
    next();
  } catch (err) {
    res.status(500).json({ message: "Validasi gagal", error: err.message });
  }
};

export const validateDeleteUser = async (req, res, next) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ message: "ID tidak valid" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    req.userId = userId;
    next();
  } catch (err) {
    res.status(500).json({ message: "Validasi gagal", error: err.message });
  }
};
