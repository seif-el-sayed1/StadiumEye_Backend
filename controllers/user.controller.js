const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const User = require("../models/user.model");
const FirebaseController = require("./firebase.controller");

class UserController {
    //@desc Get All Users
    //@route GET /api/v1/users
    //@access Private
    getAllUsers = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(User.find().select("firstName lastName email profilePicture createdAt role phone"), req.query, "User")
            .search()
            .filter()
            .paginate()
            .sort()
        const users = await features.query;
        res.status(200).json({
            status: 'success',
            totalResults: users.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            users,
        });
    });

    //@desc Get One User
    //@route GET /api/v1/users/:id
    //@access Private
    getOneUser = asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.params.id).select("firstName lastName email profilePicture createdAt role phone");
        if (!user) return next(new ApiError("User not found", 404));
        res.status(200).json({
            status: 'success',
            user,
        });
    });

    //@desc Get My Profile
    //@route GET /api/v1/users/me
    //@access Private
    getMyProfile = asyncHandler(async (req, res, next) => {
        const user = await User.findById(req.user._id).select("firstName lastName email profilePicture createdAt role phone");
        if (!user) return next(new ApiError("User not found", 404));
        res.status(200).json({
            status: 'success',
            user,
        });
    });

    //@desc Update me
    //@route PUT /api/v1/users/:id
    //@access Private
    updateMe = asyncHandler(async (req, res, next) => {
        const oldUser = await User.findById(req.user._id);
        if (!oldUser) return next(new ApiError("User not found", 404));
        if (req.body.profilePicture && oldUser.profilePicture) {
            await FirebaseController.deleteOldImage(oldUser.profilePicture, "Users");
        }
        
        const user = await User.findByIdAndUpdate(req.user._id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!user) return next(new ApiError("User not found", 404));
        res.status(200).json({
            status: 'success',
            user,
        });
    });

    //@desc Deactivate me
    //@route DELETE /api/v1/users/me
    //@access Private
    deactivateMe = asyncHandler(async (req, res, next) => {
        // Delete User After 15 Days
        const oldUser = await User.findById(req.user._id);
        if (!oldUser) return next(new ApiError("User not found", 404));
        if (oldUser.isActive) return next(new ApiError("User is already deactivated", 400));
        await FirebaseController.deleteOldImage(oldUser.profilePicture, "Users");

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                isActive: false,
                deactivatedAt: Date.now(),
                $unset: {
                    token: 1,
                    notificationToken: 1
                }
            },
        );
        res.status(200).json({
            status: 'success',
            message: "Your account has been Deleted successfully",
            user,
        });
    });
}

module.exports = new UserController();