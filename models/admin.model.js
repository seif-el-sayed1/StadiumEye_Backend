const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ADMIN } = require("../utils/constants");
const crypto = require("crypto");

const adminSchema = mongoose.Schema(
  {
    lang: {
        type: String,
        enum: ["en", "ar"],
        default: "en"
    },
    firstName: {
      type: String,
      trim: true,
      required: [true, "First name is required"]
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "Last name is required"]
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: [true, "Email is required"]
    },
    notificationToken: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    isBlocked: Boolean,
    isDeleted: {
      type: Boolean,
      default: false
    },
    password: {
      type: String,
      minLength: [6, "Too short password"]
    },
    passwordChangedAt: Date,
    isBlocked: Boolean,
    token: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpiresAt: Date,
    // Verification
    verificationToken: String,
    verificationTokenExp: Date,
  },
  { timestamps: true }
);

adminSchema.virtual("fullName").get(function () {
  if (this.firstName && this.lastName) return this.firstName + " " + this.lastName;
});


adminSchema.methods.generateToken = async function () {
  const tokenExpDate = new Date();
  tokenExpDate.setDate(
    tokenExpDate.getDate() + parseInt(process.env.JWT_EXPIRATION.toString().slice(0, -1))
  );
  const token = jwt.sign(
    { userId: this._id, role: ADMIN },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION
    }
  );
  // Save the generated token to the database
  this.token = token;
  await this.save();
  return { token, tokenExpDate };
};

adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//runs on changing the password to change the time that password changedAt
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  //hashing Password
  const salt = await bcrypt.genSalt(10);
  console.log(this.password);
  this.password = await bcrypt.hash(this.password, salt);
  console.log(this.password);
  this.passwordChangedAt = Date.now() - 1000;
  next();
  next();
});

adminSchema.methods.createEmailToken = function ({ forPassword }) {
  const hashedToken = crypto.randomBytes(32).toString("hex");

  this.verificationToken = crypto.createHash("sha256").update(hashedToken).digest("hex");
  this.verifyTokenExpiresAt = Date.now() + 10 * 60 * 1000;
  if (forPassword) return { hashedToken, resetToken: this.verificationToken };
  else return hashedToken;
};
adminSchema.methods.createPasswordResetToken = function () {
  const { hashedToken, resetToken } = this.createEmailToken({
    forPassword: true
  });
  this.passwordResetToken = resetToken;
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000;
  return hashedToken;
};
module.exports = mongoose.model("Admin", adminSchema);
