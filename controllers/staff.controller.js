const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const Staff = require("../models/staff.model");
const Team = require("../models/teams.model");
const EmailController = require("./email.controller");

const { STAFF } = require("../utils/constants");


class StaffController {
    
    // @desc    Add new staff
    // @route   POST /staff
    // @access  Private (SA)
    addStaff = async (req, res, next) => {
        const session = await mongoose.startSession();
        
        try {
            await session.startTransaction();
            const { email } = req.body;
            req.body.role = STAFF;
            // Create new admin
            const staff = new Staff(req.body);
            const passwordVerificationToken = await staff.generatePasswordVerificationToken(session);
            await staff.save({ session });

            // Send verification mail
            await EmailController.passwordCreateEmail(passwordVerificationToken, email);
            const team = await Team.findById(req.body.team);
            team.staff.push(staff._id);
            await team.save({ session });
            await session.commitTransaction();
            // response
            res.status(201).json({
                success: true,
                message:
                "Staff added successfully, a Verification password mail has been sent to his email address",
                data: {
                    _id: staff._id,
                    name: staff.name,
                    email: staff.email,
                    isVerified: staff.isVerified
                }
            });
        } catch (err) {
            await session.abortTransaction();
            next(err);
        } finally {
            session.endSession();
        }
    };

    // @desc    Verify staff
    // @route   GET /staff/create-password/:token
    // @access  private
    staffCreatePassword = asyncHandler(async (req, res, next) => {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const staff = await Staff.findOne({
            passwordVerificationToken: hashedToken,
            passwordResetExpiresAt: {
                $gt: Date.now()
            }
        });
        if (!staff) return next(new ApiError("Token Not Found!", 404));
        const { password } = req.body;

        // Update staff password and changed at time
        staff.password = password;
        staff.passwordVerificationToken = undefined;
        staff.passwordResetExpiresAt = undefined;
        staff.isVerified = true;
        await staff.save();
        // Response
        res.status(200).json({
            success: true,
            message: "Password is Created successfully, please login again..."
        });
    });

    //@desc    Get all staffs
    //@route   GET /staff
    //@access  Private (SA)
    getAllStaff = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Staff.find().select("firstName lastName email team"), req.query, "Team")
            .search()
            .filter()
            .paginate()
            .cleanResponse();

        const staff = await features.query; 

        res.status(200).json({
            status: 'success',
            totalResults: staff.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            staff
        });
    })

}

module.exports = new StaffController();