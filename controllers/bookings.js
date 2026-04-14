const Booking = require("../models/booking");
const Listing = require("../models/listing");

// Create a new booking
module.exports.createBooking = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  // Prevent owner from booking their own listing
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing!");
    return res.redirect(`/listings/${id}`);
  }

  const { checkIn, checkOut, guests } = req.body.booking;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Date validation
  if (checkInDate >= checkOutDate) {
    req.flash("error", "Check-out date must be after check-in date.");
    return res.redirect(`/listings/${id}`);
  }

  if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
    req.flash("error", "Check-in date cannot be in the past.");
    return res.redirect(`/listings/${id}`);
  }

  // Check for date conflicts with existing bookings
  const conflict = await Booking.findOne({
    listing: id,
    status: { $ne: "cancelled" },
    $or: [
      { checkIn: { $lt: checkOutDate, $gte: checkInDate } },
      { checkOut: { $gt: checkInDate, $lte: checkOutDate } },
      { checkIn: { $lte: checkInDate }, checkOut: { $gte: checkOutDate } },
    ],
  });

  if (conflict) {
    req.flash("error", "These dates are already booked. Please choose different dates.");
    return res.redirect(`/listings/${id}`);
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const totalPrice = listing.price * nights;

  const booking = new Booking({
    listing: id,
    guest: req.user._id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests: parseInt(guests),
    totalPrice,
  });

  await booking.save();

req.flash("success", `Reservation confirmed! ${nights} night(s) • ₹${totalPrice.toLocaleString("en-IN")}`);
  res.redirect(`/bookings/${booking._id}`);
};

// Show booking confirmation
module.exports.showBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate("listing")
    .populate("guest");

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/listings");
  }

  if (!booking.guest._id.equals(req.user._id)) {
    req.flash("error", "Access denied.");
    return res.redirect("/listings");
  }

  res.render("bookings/show.ejs", { booking });
};

// List all bookings for logged-in user
module.exports.myBookings = async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });

  res.render("bookings/index.ejs", { bookings });
};

// Cancel a booking
module.exports.cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    req.flash("error", "Booking not found!");
    return res.redirect("/bookings");
  }

  if (!booking.guest.equals(req.user._id)) {
    req.flash("error", "You are not authorized to cancel this booking.");
    return res.redirect("/bookings");
  }

  if (booking.checkIn < new Date()) {
    req.flash("error", "Cannot cancel a booking that has already started.");
    return res.redirect("/bookings");
  }

  booking.status = "cancelled";
  await booking.save();

  req.flash("success", "Booking cancelled successfully.");
  res.redirect("/bookings");
};