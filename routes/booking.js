const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// My bookings list
router.get("/", isLoggedIn, wrapAsync(bookingController.myBookings));

// Show single booking
router.get("/:bookingId", isLoggedIn, wrapAsync(bookingController.showBooking));

// Cancel booking
router.patch("/:bookingId/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;