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
        allowedTo(USER),
        upload.uploadMedia,
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
        allowedTo(ADMIN, SUPER_ADMIN, USER, STAFF),
        TicketsController.getOneTicket
    ).patch(
        protect, 
        allowedTo(USER),
        TicketsValidator.checkIfTicketIsOpen,
        upload.uploadMedia,
        TicketsValidator.updateTicketValidator,
        TicketsController.updateTicket
    ).delete(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, USER),
        TicketsController.deleteTicket
    )

router
    .route("/:id/assign-reject")
    .patch(
        protect, 
        allowedTo(STAFF, ADMIN, SUPER_ADMIN),
        TicketsController.assignOrRejectTicket
    )

router
    .route("/:id/closed")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, STAFF),
        TicketsController.closeTicket
    )

router
    .route("/:id/priority")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, STAFF),
        TicketsController.choosePriority
    )

router 
    .route("/:id/visibility")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, USER, STAFF),
        TicketsController.changeVisibility
    )

router
    .route("/:id/before-after")
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, STAFF),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("ticketImages"),
        TicketsController.uploadBeforeAfterImages
    )

router
    .route("/:id/report")
    .get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN, USER, STAFF),
        TicketsController.generateTicketReport
    )

module.exports = router;