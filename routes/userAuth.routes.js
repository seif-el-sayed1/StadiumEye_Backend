const express = require("express");

const { FAN } = require("../utils/constants");

// Middlewares
const { protect, allowedTo } = require("../middlewares/auth.middleware");
const FirebaseController = require("../controllers/firebase.controller");
const upload = require("../middlewares/upload.middleware");
// Classes
const UserAuthController = require("../controllers/userAuth.controller");
const UserResetPasswordController = require("../controllers/userResetPassword.controllers");
const UserValidator = require("../validators/user.validator");
const GlobalValidator = require("../validators/global.validator");

// Router
const router = express.Router();

// Auth Routes
router.route("/register").post(
  upload.uploadAnyImages,
  FirebaseController.uploadMultipleImagesForTheUser("Users"),
  UserValidator.validateRegisterUser,
  UserAuthController.userRegister
);

router.route("/login").post(GlobalValidator.validateLogin, UserAuthController.userLogin);

router.route("/verify-account").post(UserAuthController.userVerifyAccount);
//  Forgot Password Routes
router
  .route("/forgot-password")
  .post(GlobalValidator.forgetPasswordValidator, UserResetPasswordController.forgotPassword);
router
  .route("/verify-reset-code")
  .post(GlobalValidator.resetPasswordCodeValidator, UserResetPasswordController.verifyResetCode);
router
  .route("/reset-password")
  .patch(GlobalValidator.resetPasswordValidator, UserResetPasswordController.resetPassword);

router.patch(
  "/change-password",
  protect,
  allowedTo(FAN),
  GlobalValidator.validateChangePassword,
  UserAuthController.updateLoggedUserPassword
);

router.post("/verify-otp", UserAuthController.verifyOtp);
router.post("/send-otp", GlobalValidator.sendOtpValidator, UserAuthController.sendOtp);
router.post("/log-out", protect, allowedTo(FAN), UserAuthController.logOut);

module.exports = router;
