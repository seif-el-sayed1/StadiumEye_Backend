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


teamSchema.pre(/^find/, function (next) {
    this.populate({
        path: "staff",
        model: "User",
        select: "firstName lastName email"
    });
    next();
});


module.exports = mongoose.model("Team", teamSchema);