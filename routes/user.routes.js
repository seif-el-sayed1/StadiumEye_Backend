const express = require("express");

const { USER, ADMIN, STAFF, SUPER_ADMIN } = require("../utils/constants");

// Middlewares
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const FirebaseController = require("../controllers/firebase.controller");
const upload = require("../middlewares/upload.middleware");

// Classes
const UserController = require("../controllers/user.controller");
const UserValidator = require("../validators/user.validator");
// Router
const router = express.Router();

// User Routes
router
    .route("/")
    .get(
        protect,
        allowedTo(ADMIN),
        UserController.getAllUsers
    )
    
router
    .route("/me")
    .get(
        protect,
        allowedTo(USER, STAFF),
        UserController.getMyProfile
    ).patch(
        protect,
        allowedTo(USER),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImagesForTheUser("Users"),
        UserValidator.validateUpdateUser,
        UserController.updateMe
    ).delete(
        protect,
        allowedTo(USER),
        UserController.deactivateMe
    )
    
router.route("/:id/block")
    .patch(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        UserController.blockUser
    );

router.route("/:id/unblock")
    .patch(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        UserController.unblockUser
    );

router
    .route("/:id")
    .get(
        protect,
        allowedTo(ADMIN),
        UserController.getOneUser
    )

module.exports = router;