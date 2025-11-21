const asyncHandler = require("express-async-handler");
const crypto = require("crypto");

const Admin = require("../models/admin.model");
const ApiError = require("../utils/ApiError");

const EmailController = require("./email.controller");
const { translate } = require("../utils/translation");

class AdminAuthController {
  // @desc    Admin login
  // @route   POST /admins/auth/login
  // @access  Public
  login = asyncHandler(async (req, res, next) => {
    const lang = req.headers.lang || "en"
    const { email, password } = req.body;
    if (!password) return next(new ApiError(translate("Password field is required", lang), 400));
    // Check admin
    let admin = await Admin.findOne({ email }).select(
      "_id firstName lastName email password isVerified isDeleted isBlocked notificationToken"
    );
    if (!admin || admin.isDeleted) return next(new ApiError(translate("Incorrect email or password", lang), 404));
    // Check if the password is correct
    if (!(await admin.comparePassword(password)))
      return next(new ApiError(translate("Incorrect email or password", lang), 404));
    // Check if the admin is blocked
    if (admin.isBlocked) {
      return next(
        new ApiError(translate("Your account has been blocked. Please contact the super admin", lang), 403)
      );
    }
    // add notification token if exists
    if (req.body.notificationToken) admin.notificationToken = req.body.notificationToken;

    // Response message
    let message = `Welcome back ${admin.firstName + " " + admin.lastName}!`;
    // Check if account is verified
    if (admin.isVerified !== true) {
      // Generate token for verification email
      const tokenData = await admin.generateToken();
      console.log(tokenData.token);
      // Send verification mail
      await EmailController.adminVerificationEmail(tokenData.token, email);
      return res.status(200).json({
        success: true,
        message: "Verification code is sent to your email address"
      });
    }
    /*
    In case of account is not verified ^^^:
      A verification code is sent to admin's email address
      And the rest of this function is ignored vvv
  */
    // Response admin data
    const adminData = { ...admin.toJSON(), password: undefined };
    // generate token
    const tokenData = await admin.generateToken();
    // Save the token
    admin.token = tokenData.token;
    admin.tokenExpDate = tokenData.tokenExpDate;
    await admin.save();
    // response
    admin.token = undefined;
    admin.password = undefined;
    admin.isVerified = undefined;
    admin.createdAt = undefined;
    admin.updatedAt = undefined;
    // response
    res.status(200).json({
      success: true,
      message,
      data: adminData,
      token: tokenData.token,
      tokenExpDate: tokenData.tokenExpDate
    });
  });

  // @desc    Change logged in admin password
  // @route   PATCH /admins/auth/changePassword
  // @access  Private
  adminChangePassword = asyncHandler(async (req, res, next) => {
    const admin = req.user;
    const { currentPassword, newPassword } = req.body;
    const lang = req.headers.lang || "en"
    // Check current password
    if (!(await admin.comparePassword(currentPassword)))
      return next(new ApiError(translate("Incorrect current password", lang), 400));
    // Check if new password is same as current password
    if (await admin.comparePassword(newPassword))
      return next(new ApiError(translate("New password must be different from the current password", lang), 400));
    // Update password
    admin.password = newPassword;
    await admin.save();
    // Response
    res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  });

  // @desc    Account verification code
  // @route   POST /admins/auth/verifyAccount
  // @access  Public
  verifyAccount = asyncHandler(async (req, res, next) => {
    const admin = req.user;
    const { password } = req.body;
    // Check if admin is already verified
    if (admin.isVerified) return next(new ApiError(translate("This account is already verified", lang), 400));
    // Update admin document only if not already verified
    admin.password = password;
    admin.isVerified = true;
    await admin.save();

    // Response
    res.status(200).json({
      success: true,
      message: "Account is verified successfully"
    });
  });

  // @desc    Forgot admin account password
  // @route   POST /admins/auth/forgotPassword
  // @access  Public
  adminForgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const lang = req.headers.lang || "en"
    // Check email
    if (!email) return next(new ApiError(translate("Email address is required", lang), 400));
    // Check account
    const admin = await Admin.findOne({ email });
    if (!admin) return next(new ApiError(translate("Invalid email address", lang), 404));

    // Generate token
    const token = await admin.createPasswordResetToken();
    // Send email
    await EmailController.adminForgotPasswordEmail(token, email);
    await admin.save();
    // Response
    res.status(200).json({
      success: true,
      message: "Reset password email is sent to your email address"
    });
  });

  // @desc    Forgot admin account password
  // @route   PATCH /admins/auth/resetPassword
  // @access  Private
  adminResetPassword = asyncHandler(async (req, res, next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: {
        $gt: Date.now()
      }
    });
    if (!admin) return next(new ApiError("Token Not Found!", 404));
    const { password } = req.body;

    // Update admin password and changed at time
    admin.password = password;
    admin.passwordChangedAt = new Date();
    admin.verificationToken = undefined;
    admin.passwordResetToken = undefined;
    await admin.save();
    // Response
    res.status(200).json({
      success: true,
      message: "Password is reset successfully, please login again..."
    });
  });
}

module.exports = new AdminAuthController();
