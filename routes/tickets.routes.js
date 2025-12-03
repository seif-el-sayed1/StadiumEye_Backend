const express = require("express");

//constants
const { ADMIN, SUPER_ADMIN, USER, STAFF } = require("../utils/constants");


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
        allowedTo(USER, ADMIN, SUPER_ADMIN, STAFF),
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
        TicketsValidator.checkIfTicketIsOpen,
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

router
    .route("/:id/assign-reject")
    .patch(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.assignOrRejectTicket
    )

router
    .route("/:id/closed")
    .patch(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.closeTicket
    )

router
    .route("/:id/priority")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.choosePriority
    )

router 
    .route("/:id/visibility")
    .patch(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.changeVisibility
    )

router
    .route("/:id/assign")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        TicketsController.assignTicket
    )

router
    .route("/:id/before-after")
    .patch(
        protect, 
        // allowedTo(ADMIN, SUPER_ADMIN),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("ticketImages"),
        TicketsController.uploadBeforeAfterImages
    )

module.exports = router;