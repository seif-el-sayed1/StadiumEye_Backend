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

    //@desc get all managers
    //@route GET /managers
    //@access Private
    getAllManagers = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(User.find({ role: MANAGER }).select("firstName lastName email isVerified isActive"), req.query, "User")
            .search()
            .filter()
            .sort()
            .paginate()
            .cleanResponse();

        const managers = await features.query; 

        res.status(200).json({
            success: true,
            totalResults: managers.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            managers
        });
    })

    //@desc get manager by id
    //@route GET /managers/:id
    //@access Private
    getManagerById = asyncHandler(async (req, res, next) => {
        const manager = await User.findById(req.params.id).select("firstName lastName email isVerified isActive");
        if (!manager) return next(new ApiError(`No manager found for this id ${req.params.id}`, 404));
        res.status(200).json({
            success: true,
            manager
        });
    })

    //@desc update manager by id
    //@route PATCH /managers/:id
    //@access Private
    updateManagerById = asyncHandler(async (req, res, next) => {
        const manager = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!manager) return next(new ApiError(`No manager found for this id ${req.params.id}`, 404));
        res.status(200).json({
            success: true,
            message: "Manager updated successfully",
            manager
        });
    })

    //@desc deactivate Manager by id
    //@route DELETE /managers/:id
    //@access Private
    deactivateManager = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const oldManager = await User.findById(id);
        if (!oldManager) return next(new ApiError("Manager not found", 404));
        if (oldManager.isActive === false) return next(new ApiError("Manager already deactivated", 400));
        const manager = await User.findByIdAndUpdate(
            id,
            {
                isActive: false,
                deactivatedAt: Date.now(),
                $unset: {
                    token: 1,
                    notificationToken: 1
                }
            },
        );
        if (!manager) return next(new ApiError("Manager not found", 404));
        res.status(200).json({
            success: true,
            data: {
                manager
            }
        });
    })

    //@desc activate Manager by id
    //@route POST /managers/:id
    //@access Private
    activateManager = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const manager = await User.findByIdAndUpdate(id, { isActive: true });
        if (!manager) return next(new ApiError("Manager not found", 404));
        if (manager.isActive === true) return next(new ApiError("Manager already activated", 400));
        res.status(200).json({
            success: true,
            data: {
                manager
            }
        });
    })

    //@desc resend create password email 
    //@ route POST /managers/resnd-email/:id
    //@access Private
    resendPasswordEmailToManager = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const manager = await User.findById(id);
        if (!manager) return next(new ApiError("Manager not found", 404));
        if (manager.isVerified) return next(new ApiError("Manager is already verified", 400));
        const passwordVerificationToken = await manager.generatePasswordVerificationToken();
        await manager.save();
        await EmailController.passwordCreateEmail(passwordVerificationToken, manager.email);
        res.status(200).json({
            success: true,
            message: "Verification password mail has been resent to his email address"
        });
    })


}

module.exports = new ManagerController();