const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const crypto = require("crypto");
const User = require('../models/user.model');
const { MANAGER } = require('../utils/constants');
const EmailController = require('./email.controller');
const ApiFeatures = require('../utils/ApiFeatures');
const ApiError = require('../utils/ApiError');


class ManagerController {
    //@desc add new manager 
    //@route POST /managers
    //@access Private
    addManager = async(req, res, next) => {
        const session = await mongoose.startSession();
        try {
            await session.startTransaction();
            // create new manager
            req.body.role = MANAGER;
            const manager = new User(req.body);
            const passwordVerificationToken = await manager.generatePasswordVerificationToken(session);
            await manager.save({ session });

            // Send password creation mail
            await EmailController.passwordCreateEmail(passwordVerificationToken, manager.email);
            
            // end transaction
            await session.commitTransaction();
            // response
            res.status(201).json({
                success: true,
                message:
                "Manager added successfully, a Verification password mail has been sent to his email address",
                data: {
                    _id: manager._id,
                    firstName: manager.firstName,
                    lastName: manager.lastName,
                    email: manager.email,
                    isVerified: manager.isVerified
                }
            });

        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    }

    //@desc manager create password
    //@route POST /managers/create-password/:token
    //@access Private
    managerCreatePassword = asyncHandler(async (req, res, next) => {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const manager = await User.findOne({
            passwordVerificationToken: hashedToken,
            passwordResetExpiresAt: {
                $gt: Date.now()
            }
        });
        if (!manager) return next(new ApiError("Token Not Found!", 404));
        const { password } = req.body;

        // Update manager password and changed at time
        manager.password = password;
        manager.passwordVerificationToken = undefined;
        manager.passwordResetExpiresAt = undefined;
        manager.isVerified = true;
        await manager.save();
        // Response
        res.status(200).json({
            success: true,
            message: "Password is Created successfully, please login again..."
        });
    });

}

module.exports = new ManagerController();