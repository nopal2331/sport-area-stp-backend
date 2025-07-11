const express = require("express");
const {
  createBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
} = require("../controllers/booking.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  validateCreateBooking,
  validateGetBookingById,
  validateUpdateBookingStatus,
  validateUpdateBooking,
  validateDeleteBooking,
  validateAdminAccess,
} = require("../middlewares/booking.middleware");

const router = express.Router();

router.post("/", authMiddleware, validateCreateBooking, createBooking);
router.get("/my-bookings", authMiddleware, getUserBookings);
router.get("/:id", authMiddleware, validateGetBookingById, getBookingById);
router.put("/:id", authMiddleware, validateUpdateBooking, updateBooking);

router.get("/", authMiddleware, getAllBookings);
router.patch(
  "/:id/status",
  authMiddleware,
  validateAdminAccess,
  validateUpdateBookingStatus,
  updateBookingStatus
);
router.delete(
  "/:id",
  authMiddleware,
  validateAdminAccess,
  validateDeleteBooking,
  deleteBooking
);

module.exports = router;
