const express = require("express");

// Constants
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

//middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Classes
const StaffController = require("../controllers/staff.controller");
const StaffValidator = require("../validators/staff.validator");
const GlobalValidator = require("../validators/global.validator");

// Router
const router = express.Router();

// Staff Routes
router
    .route("/")
    .post(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffValidator.validateAddStaff,
        StaffController.addStaff
    ).get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffController.getAllStaff
    )


router
    .route("/resend-pass-email/:id")
    .post(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffController.resendPasswordEmailToStaff
    )

router
    .route("/:id")
    .get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffController.getOneStaff
    )
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffValidator.validateUpdateStaff,
        StaffController.updateStaff
    ).delete(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        StaffController.deactivateStaff
    )

router  
    .route("/create-password/:token")
    .post(
        GlobalValidator.validateNewPassword,
        StaffController.staffCreatePassword
    ) 

module.exports = router