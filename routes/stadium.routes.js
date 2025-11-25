const express = require("express");

// Constants
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

//middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Classes
const StadiumController = require("../controllers/stadium.controller")
const StadiumValidator = require("../validators/stadium.validator");
const FirebaseController = require("../controllers/firebase.controller");

// Router
const router = express.Router();

// Stadium Routes
router
    .route("/")
    .post(
        protect, 
        allowedTo(ADMIN, SUPER_ADMIN),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("StadiumImages"),
        FirebaseController.uploadMultipleVideos("StadiumVideos"),
        StadiumValidator.addStadiumValidator,
        StadiumController.addStadium
    )
    .get(StadiumController.getAllStadiums)

router
    .route("/:id")
    .get(StadiumController.getSingleStadium)
    .patch(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        upload.uploadMedia,
        FirebaseController.uploadMultipleImages("StadiumImages"),
        FirebaseController.uploadMultipleVideos("StadiumVideos"),
        StadiumValidator.updateStadiumValidator,
        StadiumController.updateStadium
    )
    .delete(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        StadiumController.deleteStadium
    );

module.exports = router;