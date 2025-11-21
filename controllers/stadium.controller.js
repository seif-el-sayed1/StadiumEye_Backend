const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const Stadium = require("../models/stadium.model");
const FirebaseController = require("./firebase.controller");

class StadiumController {
    // @desc  Add Stadium
    // @route POST /stadiums
    // @access Private/Admin
    addStadium = asyncHandler(async (req, res, next) => {
        const stadium = await Stadium.create(req.body);
        res.status(201).json({
            status: "success",
            message: "Stadium added successfully",
            stadium
        });
    })
    
    //@desc  Get All Stadiums
    //@route GET /stadiums
    //@access Public
    getAllStadiums = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Stadium.find(), req.query, "Stadium")
        .search()
        .filter()
        .paginate()
        .cleanResponse();

        const stadiums = await features.query;

        res.status(200).json({
            status: 'success',
            totalResults: stadiums.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            stadiums,
        });
    })

    //@desc  Get Single Stadium
    //@route GET /stadiums/:id
    //@access Public
    getSingleStadium = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const stadium = await Stadium.findById(id).select("-__v - createdAt - updatedAt");
        if (!stadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }
        res.status(200).json({
            status: "success",
            stadium
        });
    })

    // @desc  Update Stadium
    // @route PUT /stadiums/:id
    // @access Private/Admin
    updateStadium = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const oldStadium = await Stadium.findById(id);
        if (!oldStadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }
        

        if (req.body.stadiumVideos) {
            const oldVideos = oldStadium.stadiumVideos || [];
            const newVideos = req.body.stadiumVideos || [];
            const videosToDelete = oldVideos.filter(oldVid => !newVideos.includes(oldVid));
            for (const video of videosToDelete) {
                await FirebaseController.deleteOldVideo(video, "StadiumVideos");
            }
        }
        if (req.body.stadiumImages) {
            const oldImages = oldStadium.stadiumImages || [];
            const newImages = req.body.stadiumImages || [];
            const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
            for (const image of imagesToDelete) {
                await FirebaseController.deleteOldImage(image, "StadiumImages");
            }
        }

        const stadium = await Stadium.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: "Stadium updated successfully",
            stadium
        });
    });

    // @desc  Delete Stadium
    // @route DELETE /stadiums/:id
    // @access Private/Admin
    deleteStadium = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const stadium = await Stadium.findByIdAndDelete(id);
        if (!stadium) {
            return next(new ApiError(`Stadium Not Found`, 404));
        }

        if (stadium.stadiumImages && stadium.stadiumImages.length > 0) {
            for (const img of stadium.stadiumImages) {
                await FirebaseController.deleteOldImage(img, "StadiumImages");
            }
        }

        if (stadium.stadiumVideos && stadium.stadiumVideos.length > 0) {
            for (const vid of stadium.stadiumVideos) {
                await FirebaseController.deleteOldVideo(vid, "StadiumVideos");
            }
        }

        res.status(200).json({
            status: "success",
            message: "Stadium deleted successfully",
            stadium
        });
    });



}

module.exports = new StadiumController();