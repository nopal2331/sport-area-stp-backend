import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token sudah kedaluwarsa" });
      }
      return res.status(403).json({ message: "Token tidak valid" });
    }

    req.user = decoded;
    next();
  });
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Hanya admin yang bisa mengakses" });
  }
  next();
};

export const validateRegisterUser = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const phoneRegex = /^[0-9]{10,14}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Nama tidak boleh kosong" });
  }

  if (name.length < 4) {
    return res.status(400).json({ message: "Nama minimal 4 karakter" });
  }

  if (typeof phone !== "string" || phone.trim() === "") {
    return res
      .status(400)
      .json({ message: "Nomor Handphone tidak boleh kosong" });
  }

  if (phone.length < 10) {
    return res
      .status(400)
      .json({ message: "Nomor Handphone minimal 10 karakter" });
  }

  if (!phoneRegex.test(phone)) {
    return res
      .status(400)
      .json({ message: "Format nomor Handphone tidak valid" });
  }

  if (typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({ message: "Email tidak boleh kosong" });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid" });
  }

  if (typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ message: "Password tidak boleh kosong" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  req.validatedRegister = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: phone.trim(),
  };

  next();
};

export const validateLoginUser = (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({ message: "Email tidak boleh kosong" });
  }

  if (typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ message: "Password tidak boleh kosong" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Format email tidak valid" });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  req.validatedLogin = {
    email: email.trim().toLowerCase(),
    password,
  };

  next();
};
