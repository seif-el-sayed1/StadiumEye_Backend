const express = require("express");

// Constants
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

//middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Classes
const ManagerController = require("../controllers/manager.controller");
const ManagerValidator = require("../validators/manager.validator");
const GlobalValidator = require("../validators/global.validator");

// Router
const router = express.Router();

// Manager Routes
router
    .route("/")
    .post(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerValidator.validateAddManager,
        ManagerController.addManager
    ).get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerController.getAllManagers
    )

router
    .route("/:id")
    .get(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerController.getManagerById
    )
    .post(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerController.activateManager
    )
    .patch(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerValidator.validateUpdateManager,
        ManagerController.updateManagerById
    ).delete(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        ManagerController.deactivateManager
    )

router  
    .route("/create-password/:token")
    .post(
        GlobalValidator.validateNewPassword,
        ManagerController.managerCreatePassword
    ) 

module.exports = router