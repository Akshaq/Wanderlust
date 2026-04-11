const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const mongoose = require("mongoose");
const {isLoggedIn, isOwner, validateListing, isReviewAuthor} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn,
        validateListing,
        wrapAsync(listingController.createListing)
    );

//New Route
router.get("/new", isLoggedIn, listingController.renderNewForm );


router
    .route("/:id")
    .get(wrapAsync(listingController.showlisting))
    .put(
        isLoggedIn,
        isOwner,
        validateListing,
        wrapAsync (listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync (listingController.destroyListing)
    );


// Edit Route
router.get(
    "/:id/edit", 
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;