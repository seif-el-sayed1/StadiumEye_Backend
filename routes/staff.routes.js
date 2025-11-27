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
    )

router  
    .route("/create-password/:token")
    .post(
        GlobalValidator.validateNewPassword,
        StaffController.staffCreatePassword
    )

module.exports = router