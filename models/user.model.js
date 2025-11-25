const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  USER,
  MANAGER,
  STAFF,
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
      enum: [USER, MANAGER, STAFF],
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
      required: false,
      default: ""
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
    },
    // region: { type: mongoose.Schema.Types.ObjectId, ref: "Region" },
    // nationalId: String,
    // verifiedNationalId: {
    //   type: Boolean,
    //   default: false
    // },
    // Password
    password: {
      type: String,
      minLength: [6, "Too short password"],
      validate: {
        validator: function (v) {
          if (this.loginType || this.loginType === "google" || this.loginType === "apple") {
            return true;
          }
          return v && v.length >= 8;
        },
        message: (props) =>
          `${props.value} is not a valid password! Password must be at least 8 characters long`
      }
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetCodeExp: Date,
    passwordResetCodeVerified: Boolean,
    // Verification
    verificationCode: String,
    verificationCodeExp: Date,
    verificationCodeVerified: Boolean,
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
  else if (this.ownerName && this.entityName)
    return this.entityName.charAt(0).toUpperCase() + this.entityName.slice(1);
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

// Middleware to check if password is required
userSchema.pre("validate", function (next) {
  if (this.loginType === "email" && !this.password) {
    this.invalidate("password", "Password is required");
  }
  next();
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

userSchema.pre(/\bfind/, function (next) {
  let lang = this.getOptions().lang || this.lang || "en";
  if (this.getOptions().userLocationPopulation) {
    this.populate({
      path: "city",
      model: "City",
      select: `_id ${
        lang ? (lang === "all" ? "nameEn nameAr" : `name${capitalizeFirstLetter(lang)}`) : "nameEn"
      }`
    });

//     this.populate({
//       path: "region",
//       model: "Region",
//       select: `_id ${
//         lang ? (lang === "all" ? "nameEn nameAr" : `name${capitalizeFirstLetter(lang)}`) : "nameEn"
//       }`
//     });

    this.populate({
      path: "country",
      model: "Country",
      select: `_id ${
        lang ? (lang === "all" ? "nameEn nameAr" : `name${capitalizeFirstLetter(lang)}`) : "nameEn"
      }`
    });
  }

  if (this.getOptions().skipPopulation) return next();

  next();
});

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

module.exports = mongoose.model("User", userSchema);