const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
const { generateCode, hashCode } = require("../utils/generateCode");
const EmailController = require("./email.controller");

class UserResetPasswordController {
  // @desc    User Forgot Password
  // @route   POST /user/auth/forgotPassword
  // @access  Public
  forgotPassword = asyncHandler(async (req, res, next) => {
    let user = req.requestedUser;
    const { email } = req.body;
    const { code: resetCode, hashedCode: hashedResetCode } = await generateCode();
    // Save hashed reset code in DB
    user.passwordResetCode = hashedResetCode;
    user.passwordResetCodeExp = Date.now() + 10 * 60 * 1000;
    user.passwordResetCodeVerified = false;
    await user.save();
    if (email) await EmailController.userResetPasswordEmail(email, resetCode);
    // Response
    res.status(200).json({
      success: true,
      message: `Reset OTP is sent to your email`,
      email: email ? user.email : undefined,
      codeExp: user.passwordResetCodeExp
    });
  });

  // @desc    User verify reset code
  // @route   POST /user/auth/verifyResetCode
  // @access  Public
  verifyResetCode = asyncHandler(async (req, res, next) => {
    const lang = req.headers.lang || "en";
    // Hash code
    const hashedResetCode = crypto.createHash("sha256").update(req.body.code).digest("hex");
    let user = req.requestedUser;
    // Check code expiration
    if (Date.now() >= Date.parse(user.passwordResetCodeExp))
      return next(new ApiError(translate("Reset OTP is expired", lang), 401));
    // Check code
    if (user.passwordResetCode !== hashedResetCode)
      return next(new ApiError(translate("Invalid reset code", lang), 401));
    // Update user => verified
    user.passwordResetCodeVerified = true;
    await user.save();
    // Response
    res.status(200).json({
      success: true,
      message: "Reset OTP is verified successfully",
      phone: user.phone
    });
  });

  // @desc    User reset password
  // @route   PATCH /user/auth/resetPassword
  // @access  Public
  resetPassword = asyncHandler(async (req, res, next) => {
    const { newPassword } = req.body;
    let user = req.requestedUser;
    // Update user data
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExp = undefined;
    user.passwordResetCodeVerified = undefined;
    user.token = undefined;
    await user.save();
    // Response
    res.status(200).json({
      success: true,
      message: "Password is reset successfully"
    });
  });
}

module.exports = new UserResetPasswordController();
