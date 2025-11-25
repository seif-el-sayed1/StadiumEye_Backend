const express = require("express");

//constants
const { ADMIN, SUPER_ADMIN, USER } = require("../utils/constants");


//middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Classes
const TicketsController = require("../controllers/tickets.controller")
const TicketsValidator = require("../validators/tickets.validator");
const FirebaseController = require("../controllers/firebase.controller");

// Router
const router = express.Router();

// Ticket Routes
router
    .route("/")
    .post(
        protect, 
        allowedTo(USER, ADMIN, SUPER_ADMIN),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("ticketImages"),
        FirebaseController.uploadMultipleVideos("ticketVideos"),
        TicketsValidator.addTicketValidator,
        TicketsController.addTicket
    ).get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.getAllTickets
    )

router
    .route("/my")
    .get(
        protect, 
        allowedTo(USER),
        TicketsController.getMyTickets
    )

router
    .route("/:id")
    .get(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.getOneTicket
    ).patch(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("ticketImages"),
        FirebaseController.uploadMultipleVideos("ticketVideos"),
        TicketsValidator.updateTicketValidator,
        TicketsController.updateTicket
    ).delete(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.deleteTicket
    )


module.exports = router;