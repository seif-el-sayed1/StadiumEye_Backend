const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  USER,
  STAFF,
  MANAGER,
  LOGIN_TYPE_LIST,
} = require("../utils/constants");
const capitalizeFirstLetter = require("../utils/capitalizeFirstLetter");
const localizationSetUp = require("../utils/modelLocalizationSetUp");

const userSchema = mongoose.Schema(
  {
    lang: {
      type: String,
      enum: ["en", "ar"],
      default: "en"
    },
    loginType: {
      type: String,
      enum: LOGIN_TYPE_LIST,
      default: "email"
    },
    firstName: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: [USER, STAFF, MANAGER],
      default: USER
    },
    lastName: {
      type: String,
      trim: true
    },
    genderEn: {
      type: String,
      enum: ["male", "female"],
      lower: true
    },
    genderAr: {
      type: String,
      enum: ["ذكر", "أنثى"]
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    dateOfBirth: {
      type: Date
    },
    phone: {
      type: String,
      trim: true
    },
    profilePicture: {
      type: String,
      default: ""
    },
    // Password
    password: {
      type: String,
      minLength: [6, "Too short password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetCodeExp: Date,
    passwordResetCodeVerified: Boolean,
    // Verification
    verificationCode: String,
    verificationCodeExp: Date,
    verificationCodeVerified: Boolean,
    passwordVerificationToken: String,
    passwordResetExpiresAt: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    // Active
    deactivatedAt: {
      type: Date,
      expires: "15d"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    token: String,
    tokenExpDate: Date,
    notificationToken: String,
  },
  { timestamps: true, discriminatorKey: "role" }
);
userSchema.index({ location: "2dsphere" });

// Creating a partial unique index
userSchema.index(
  { phone: 1 }, // The field to index
  {
    unique: true, // Enforce uniqueness
    partialFilterExpression: { phone: { $exists: true } } // Apply uniqueness only when `phone` is not null
  }
);
userSchema.index(
  { email: 1 }, // The field to index
  {
    unique: true, // Enforce uniqueness
    partialFilterExpression: { email: { $exists: true } } // Apply uniqueness only when `email` is not null
  }
);

// Model Localization
userSchema.set("toJSON", {
  virtuals: true,
  transform: localizationSetUp(["gender"])
});

userSchema.virtual("fullName").get(function () {
  // this to capitalize first & last name of fullName
  if (this.firstName && this.lastName)
    return (
      this.firstName.charAt(0).toUpperCase() +
      this.firstName.slice(1) +
      " " +
      this.lastName.charAt(0).toUpperCase() +
      this.lastName.slice(1)
    );
});

userSchema.virtual("age").get(function () {
  const currentDate = new Date();
  const birthDate = new Date(this.dateOfBirth);
  const age = currentDate.getFullYear() - birthDate.getFullYear();
  // Adjust age if the birthday hasn't occurred yet this year
  if (
    currentDate.getMonth() < birthDate.getMonth() ||
    (currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate())
  ) {
    return age - 1 || undefined;
  }
  return age || undefined;
});


userSchema.methods.generateToken = async function () {
  const tokenExpDate = new Date(); // Get the current date
  tokenExpDate.setDate(
    tokenExpDate.getDate() + parseInt(process.env.JWT_EXPIRATION.toString().slice(0, -1))
  );
  const token = jwt.sign(
    {
      userId: this._id,
      role: this.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRATION
    }
  );
  // Save the generated token to the database
  this.token = token;
  this.tokenExpDate = tokenExpDate;
  this.updatePassword = false; // to skip hashing the password

  await this.save();

  return { token, tokenExpDate };
};

userSchema.methods.comparePassword = async function (password) {
  if (this.loginType !== "email") {
    if (password) return false;
  } else return await bcrypt.compare(password, this.password);
};

//runs on changing the password to change the time that password changedAt
userSchema.pre("save", async function (next) {
  if (this.firstName && this.lastName) {
    this.firstName = this.firstName.charAt(0).toUpperCase() + this.firstName.slice(1);
    this.lastName = this.lastName.charAt(0).toUpperCase() + this.lastName.slice(1);
  } else if (!this.firstName && this.loginType.toLowerCase() !== "email") this.firstName = "New";
  else if (!this.lastName && this.loginType.toLowerCase() !== "email") this.lastName = "User";
  if (!this.password) return next();
  if (!this.isModified("password")) return next();
  //hashing Password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.generatePasswordVerificationToken = async function (session) {
  // Generate a random token
  const passwordCreationToken = crypto.randomBytes(32).toString("hex");
  console.log("Generated Token:", passwordCreationToken);
  // Hash the token before storing it in the DB
  const hashedToken = crypto.createHash("sha256").update(passwordCreationToken).digest("hex");

  // Set the token and expiration in the schema
  this.passwordVerificationToken = hashedToken;
  this.passwordResetExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
  // Save the admin document with the token
  await this.save({ validateBeforeSave: false });

  return passwordCreationToken;
};

module.exports = mongoose.model("User", userSchema);