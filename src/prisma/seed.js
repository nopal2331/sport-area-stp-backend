import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error("❌ ADMIN_PASSWORD tidak ditemukan di .env");
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Data user (admin + pengguna biasa)
  const users = [
    {
      name: "Admin STP",
      email: "admin@gmail.com",
      phone: "08123456789",
      password: hashedPassword,
      role: "admin",
    },
    {
      name: "Budi Santoso",
      email: "budi@gmail.com",
      phone: "0811111111",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Siti Aminah",
      email: "siti@gmail.com",
      phone: "0822222222",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Agus Wijaya",
      email: "agus@gmail.com",
      phone: "0833333333",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Rina Kartika",
      email: "rina@gmail.com",
      phone: "0844444444",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Dedi Gunawan",
      email: "dedi@gmail.com",
      phone: "0855555555",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Rudi Santoso",
      email: "rudi@gmail.com",
      phone: "0866666666",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Rina Kartika",
      email: "rina@gmail.com",
      phone: "0877777777",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Tina Pratiwi",
      email: "tina@gmail.com",
      phone: "0888888888",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Joko Susilo",
      email: "joko@gmail.com",
      phone: "0899999999",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Wati Lestari",
      email: "wati@gmail.com",
      phone: "0900000000",
      password: hashedPassword,
      role: "user",
    },
    {
      name: "Eko Prabowo",
      email: "eko@gmail.com",
      phone: "0911111111",
      password: hashedPassword,
      role: "user",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log("✅ Semua user berhasil di-seed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
