const express = require("express");

// Constants
const { SUPER_ADMIN, ADMIN } = require("../utils/constants");

//middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Classes
const TeamController = require("../controllers/team.controller");

// Router
const router = express.Router();

// Team Routes

router
    .route("/")
    .get(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        TeamController.getAllTeams
    )
    .post(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        TeamController.addTeam
    );

router
    .route("/:id")
    .get(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        TeamController.getOneTeam
    ).patch(
        protect,
        allowedTo(ADMIN, SUPER_ADMIN),
        TeamController.updateTeam
    )

module.exports = router;
