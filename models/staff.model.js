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



const Staff = User.discriminator(STAFF, staffSchema);
module.exports = Staff;

