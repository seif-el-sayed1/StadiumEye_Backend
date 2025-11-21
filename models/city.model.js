const mongoose = require("mongoose");
const localizationSetUp = require("../utils/modelLocalizationSetUp");
const capitalizeFirstLetter = require("../utils/capitalizeFirstLetter");

const citySchema = mongoose.Schema(
  {
    nameEn: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "English name is required"]
    },
    nameAr: {
      type: String,
      default: " ",
      required: [true, "Arabic name is required"]
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: [true, "Country is required"]
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure nameEn & nameAr is unique within each country
citySchema.index({ nameEn: 1, country: 1 }, { unique: true });

// Model Localization
citySchema.set("toJSON", {
  virtuals: true,
  transform: localizationSetUp(["name"])
});

citySchema.set("toObject", {
  virtuals: true
});

citySchema.pre(/\bfind/, async function (next) {
  this.populate({
    path: "country",
    model: "Country",
    select: "-__v -createdAt -updatedAt"
  });
  next();
});

citySchema.pre("save", async function (next) {
  await this.populate({
    path: "country",
    model: "Country",
    select: "-__v -createdAt -updatedAt"
  });
  next();
});

module.exports = mongoose.model("City", citySchema);
