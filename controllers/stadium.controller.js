const asyncHandler = require("express-async-handler");
const path = require("path")
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const { generatePDFReport, generateExcelReport } = require("../utils/generateReports");
const Stadium = require("../models/stadium.model");
const User = require("../models/user.model");
const Ticket = require("../models/ticket.model");
const FirebaseController = require("./firebase.controller");
const mongoose = require("mongoose");

class StadiumController {
    // @desc  Add Stadium
    // @route POST /stadiums
    // @access Private/Admin
    addStadium = asyncHandler(async (req, res, next) => {
        const stadiumImages = [];
        const stadiumVideos = [];

        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                if (file.mimetype.startsWith("image")) {
                    stadiumImages.push(`/uploads/images/${file.filename}`);
                }

                if (file.mimetype.startsWith("video")) {
                    stadiumVideos.push(`/uploads/videos/${file.filename}`);
                }
            });
        }

        req.body.stadiumImages = stadiumImages;
        req.body.stadiumVideos = stadiumVideos;

        const stadium = await Stadium.create(req.body);

        res.status(201).json({
            status: "success",
            message: "Stadium added successfully",
            stadium
        });
    });
    
    //@desc  Get All Stadiums
    //@route GET /stadiums
    //@access Public
    getAllStadiums = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Stadium.find().populate("tickets", "area observations"), req.query, "Stadium")
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

        const stadium = await Stadium.findById(id).select("-__v -createdAt -updatedAt")
            .populate("tickets", "area observations");

        if (!stadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }

        res.status(200).json({
            status: "success",
            data: stadium,
        });
    });

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

    //@desc  Dashboard stats
    //@route GET /stadiums/stats
    //@access Private
    getDashboardStats = asyncHandler(async (req, res) => {
        const rawStatusStats = await Ticket.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const TICKET_STATUS = ["open","inProgress","resolved","closed","rejected"];

        const ticketStatusStats = {};
        TICKET_STATUS.forEach(status => {
            ticketStatusStats[`${status}Tickets`] =
                rawStatusStats.find(s => s._id === status)?.count || 0;
        });

        const rawTicketsPerMonth = await Ticket.aggregate([
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const monthsNames = [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
        ];

        const ticketsPerMonth = {};
        for (let i = 1; i <= 12; i++) {
            const found = rawTicketsPerMonth.find(m => m._id.month === i);
            ticketsPerMonth[monthsNames[i - 1]] = found ? found.count : 0;
        }

        const rawStadiumStats = await Stadium.aggregate([
            {
                $lookup: {
                    from: "tickets",
                    localField: "_id",
                    foreignField: "stadium",
                    as: "tickets"
                }
            },
            {
                $project: {
                    stadiumName: 1,
                    ticketsCount: { $size: "$tickets" }
                }
            }
        ]);

        const stadiumTicketStats = rawStadiumStats.map(item => ({
            stadiumName: item.stadiumName,
            ticketsCount: item.ticketsCount
        }));

        const activeUsers = await User.countDocuments({
            role: "user",
            isActive: true
        });

        const activeStaff = await User.countDocuments({
            role: "staff",
            isActive: true
        });

        res.status(200).json({
            status: "success",
            data: {
                ticketStatusStats,
                ticketsPerMonth,
                stadiumTicketStats,
                activeUsers,
                activeStaff
            }
        });
    });

    //@desc  Export Reports
    //@route GET /stadiums/reports
    //@access Private
    exportReport = asyncHandler(async (req, res) => {
        const {
            stadiums,        
            dateRange = "all", 
            includeMedia = false,
            format = "pdf"     
        } = req.body;

        const filters = {
            stadiums: stadiums === "all" || !stadiums ? [] : stadiums,
            dateRange,
            includeMedia: includeMedia === true || includeMedia === "true"
        };

        let buffer, filename, contentType;

        if (format === "excel") {
            buffer = await generateExcelReport(filters);
            filename = `StadiumEye_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        } else {
            buffer = await generatePDFReport(filters);
            filename = `StadiumEye_Report_${new Date().toISOString().slice(0,10)}.pdf`;
            contentType = "application/pdf";
        }

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", contentType);
        res.send(buffer);
    });
}

module.exports = new StadiumController();