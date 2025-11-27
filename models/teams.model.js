const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
    teamName: {
        type: String,
        required: [true, "Team name is required"]
    },
    teamType: {
        type: String,
        enum: ["reports", "maintenance"],
        required: [true, "Team type is required"]
    },
    staff: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);