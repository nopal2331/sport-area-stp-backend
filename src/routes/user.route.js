const express = require("express");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middlewares/auth.middleware");
const {
  validateGetAllUsers,
  validateGetUserById,
  validateUpdateUser,
  validateDeleteUser,
} = require("../middlewares/user.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  validateGetAllUsers,
  getAllUsers
);

router.get("/:id", authMiddleware, validateGetUserById, getUserById);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateUpdateUser,
  updateUser
);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validateDeleteUser,
  deleteUser
);

module.exports = router;
