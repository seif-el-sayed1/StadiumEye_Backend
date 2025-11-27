const mongoose = require("mongoose");
const User = require("./user.model");
const { STAFF } = require("../utils/constants");

const staffSchema = mongoose.Schema({
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true
    },
}, { timestamps: true });

staffSchema.pre(/^find/, function (next) {
    this.populate({
        path: "team",
        model: "Team",
        select: "teamName teamType"
    });
    next();
});



const Staff = User.discriminator(STAFF, staffSchema);
module.exports = Staff;

