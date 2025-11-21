const express = require("express");

// Constants
const { ADMIN } = require("../utils/constants");

// Auth middleware
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Classes
const AdminAuthController = require("../controllers/adminAuth.controllers");
const GlobalValidator = require("../validators/global.validator");

// Router
const router = express.Router();

// Auth Routes
router.route("/login").post(GlobalValidator.validateLogin, AdminAuthController.login);

router
  .route("/verify-account")
  .post(
    protect,
    allowedTo(ADMIN),
    GlobalValidator.validateNewPassword,
    AdminAuthController.verifyAccount
  );

router
  .route("/reset-password")
  .patch(
    protect,
    allowedTo(ADMIN),
    GlobalValidator.validateChangePassword,
    AdminAuthController.adminChangePassword
  );

// Reset Password Routes
router.route("/forget-password").post(AdminAuthController.adminForgotPassword);

router
  .route("/reset-password/:token")
  .patch(GlobalValidator.validateNewPassword, AdminAuthController.adminResetPassword);

module.exports = router;
