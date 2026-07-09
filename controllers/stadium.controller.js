const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const { generatePDFReport, generateExcelReport } = require("../utils/generateReports");
const Stadium = require("../models/stadium.model");
const Venue = require("../models/venue.model");
const User = require("../models/user.model");
const Ticket = require("../models/ticket.model");
const extractLatLong = require("../utils/extractCoordinates.js");
const { findVenueByName, findFixtureByVenueAndDate, syncVenuesByCountry } = require("../utils/footballApi");
const getNearestStadium = require("../utils/getNearestStadium");

const deleteLocalFile = (filePath) => {
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

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
      const features = new ApiFeatures(
            Stadium.find()
                .populate("city")
                .populate({
                    path: "manager",
                    select: "firstName lastName email phone isVerified",
                }),
            req.query,
            "Stadium"
        )
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

        const stadium = await Stadium.findById(id)
            .select("-__v -createdAt -updatedAt")
            .populate("city")
            .populate({
                path: "manager",
                select: "firstName lastName email phone isVerified",
            });

        if (!stadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }

        res.status(200).json({
            status: "success",
            data: stadium,
        });
    });

    // @desc  Update Stadium
    // @route Patch /stadiums/:id
    // @access Private/Admin
    updateStadium = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const oldStadium = await Stadium.findById(id);
        if (!oldStadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }

        if (req.body.stadiumImages) {
            const oldImages = oldStadium.stadiumImages || [];
            const newImages = req.body.stadiumImages || [];
            const imagesToDelete = oldImages.filter(img => !newImages.includes(img));
            for (const image of imagesToDelete) {
                deleteLocalFile(image);
            }
        }

        if (req.body.stadiumVideos) {
            const oldVideos = oldStadium.stadiumVideos || [];
            const newVideos = req.body.stadiumVideos || [];
            const videosToDelete = oldVideos.filter(vid => !newVideos.includes(vid));
            for (const video of videosToDelete) {
                deleteLocalFile(video);
            }
        }

        if (req.files?.length) {
            req.files.forEach((file) => {
                if (file.mimetype.startsWith("image")) {
                    req.body.stadiumImages = req.body.stadiumImages || [];
                    req.body.stadiumImages.push(`/uploads/images/${file.filename}`);
                }
                if (file.mimetype.startsWith("video")) {
                    req.body.stadiumVideos = req.body.stadiumVideos || [];
                    req.body.stadiumVideos.push(`/uploads/videos/${file.filename}`);
                }
            });
        }

        if (req.body.isActive !== undefined) {
            req.body.isActive = req.body.isActive === "true";
        }

        const stadium = await Stadium.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (typeof req.body.isActive === "boolean") {
            await Ticket.updateMany(
                { stadium: stadium._id },
                {
                    $set: {
                        stadiumStatus: req.body.isActive ? "active" : "inActive"
                    }
                }
            );
        }

        res.status(200).json({
            status: "success",
            message: "Stadium updated successfully",
            stadium
        });
    });


    // @desc Update activation status
    // @route PUT /stadiums/:id/activate
    // @access Private/Admin
    updateActivationStatus = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const stadium = await Stadium.findById(id);
        if (!stadium) {
            return next(new ApiError(`No stadium found for this id ${id}`, 404));
        }

        stadium.isActive = !stadium.isActive;
        await stadium.save();

        const ticketStadiumStatus = stadium.isActive ? "active" : "inActive";

        await Ticket.updateMany(
            { stadium: stadium._id },
            { $set: { stadiumStatus: ticketStadiumStatus } }
        );

        res.status(200).json({
            status: "success",
            message: `Stadium is now ${stadium.isActive ? "active" : "inactive"}`,
            stadium
        });
    });

    // @desc  Delete Stadium
    // @route DELETE /stadiums/:id
    // @access Private/Admin
    deleteStadium = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const stadium = await Stadium.findById(id);
        if (!stadium) {
            return next(new ApiError("Stadium Not Found", 404));
        }

        await Ticket.updateMany(
            { stadium: id },
            { $set: { stadiumStatus: "deleted" } }
        );

        if (stadium.stadiumImages?.length) {
            for (const img of stadium.stadiumImages) {
                deleteLocalFile(img);
            }
        }

        if (stadium.stadiumVideos?.length) {
            for (const vid of stadium.stadiumVideos) {
                deleteLocalFile(vid);
            }
        }

        await Stadium.findByIdAndDelete(id);

        res.status(200).json({
            status: "success",
            message: "Stadium deleted and related tickets updated successfully"
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

    //@desc get next match in the nearest stadium depend on user location 
    //@route POST /stadiums/next-match
    //@access Private
    getNextMatch = asyncHandler(async (req, res, next) => {
        const { lat, lng } = req.body;
        const userId = req.user._id;

        if (typeof lat !== "number" || typeof lng !== "number") {
            return next(new ApiError("Invalid coordinates. Please provide valid lat and lng.", 400));
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return next(new ApiError("Coordinates out of range.", 400));
        }

        const latLong = { lat, long: lng };

        const nearestStadium = await getNearestStadium(latLong);
        if (!nearestStadium) {
            return next(new ApiError("No stadiums found near your location.", 404));
        }

        await Stadium.populate(nearestStadium, { path: "city" });

        const venue = await findVenueByName(nearestStadium.stadiumName);
        if (!venue) {
            return next(new ApiError("No stadiums found.", 404));
        }

        const today = new Date().toISOString().split("T")[0];
        const fixture = await findFixtureByVenueAndDate(venue.id, today);
        if (!fixture) {
            return next(new ApiError("No matches found today at this stadium.", 404));
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                lastNextMatch: {
                    stadium: nearestStadium._id,
                    venueId: venue.id,
                    match: {
                        teams: {
                            homeTeam: fixture.teams.home.name,
                            awayTeam: fixture.teams.away.name,
                            time: fixture.fixture.date
                        }
                    }
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: {
                stadium: {
                    location: nearestStadium.location,
                    name: nearestStadium.name,
                    city: nearestStadium.city,
                    isActive: nearestStadium.isActive,
                    distance: nearestStadium.distance
                },
                venue,
                fixture,
                savedUser: user.lastNextMatch
            }
        });
    });

    //@desc  Sync Saudi Arabia venues
    //@route POST /stadiums/sync-venues
    //@access Private/Admin
    syncVenues = asyncHandler(async (req, res, next) => {
        await syncVenuesByCountry("Saudi-Arabia");

        res.status(200).json({
            success: true,
            message: "Saudi Arabia venues synced successfully"
        });
    });

    //@desc get stadium names
    //@route GET /stadiums/names
    //@access Private
    getStadiumsNames = asyncHandler(async (req, res, next) => {
        const usedStadiumNames = await Stadium.distinct("stadiumName");

        const features = new ApiFeatures(
            Venue.find({ name: { $nin: usedStadiumNames } }),
            req.query,
            "Venue"
        )
            .search()
            .filter()
            .sort()
            .cleanResponse()
            .paginate();

        const venues = await features.query;

        res.status(200).json({
            success: true,
            results: venues.length,
            data: venues
        });
    });
}

module.exports = new StadiumController();