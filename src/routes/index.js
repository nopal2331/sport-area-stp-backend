const express = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const bookingRoute = require("./booking.route");
const reportRoute = require("./report.route");

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/bookings", bookingRoute);
router.use("/reports", reportRoute);

module.exports = router;
