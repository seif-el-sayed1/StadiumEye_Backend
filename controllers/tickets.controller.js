const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose")
const ApiError = require('../utils/ApiError');
const ApiFeatures = require("../utils/ApiFeatures");
const Tickets = require("../models/ticket.model");
const User = require("../models/user.model");
const Team = require("../models/teams.model");
const Admin = require("../models/admin.model");
const Stadium = require("../models/stadium.model");
const EmailController = require("./email.controller");
const  processDetections  = require("../utils/processDetections");

const deleteLocalFile = (filePath) => {
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

const deleteFiles = (files, folderName) => {
    if (!files?.length) return;
    for (const file of files) {
        const fileName = path.basename(file);
        deleteLocalFile(`/uploads/${folderName}/${fileName}`);
    }
};
class TicketsController { 

    //@decs  Add Ticket
    //@route POST /tickets
    //@access Public
    addTicket = asyncHandler(async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const ticketImages = [];
            const ticketVideos = [];
            const ticketVoices = [];

            // Categorize uploaded files by MIME type into separate arrays
            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    if (file.mimetype.startsWith("image"))
                        ticketImages.push(`/uploads/images/${file.filename}`);
                    if (file.mimetype.startsWith("video"))
                        ticketVideos.push(`/uploads/videos/${file.filename}`);
                    if (file.mimetype.startsWith("audio"))
                        ticketVoices.push(`/uploads/voices/${file.filename}`);
                });
            }

            const { mode, modelType, ...ticketData } = req.body;

            if (ticketImages.length > 0) ticketData.ticketImages = ticketImages;
            if (ticketVideos.length > 0) ticketData.ticketVideos = ticketVideos;
            if (ticketVoices.length > 0) ticketData.ticketVoices = ticketVoices;
            ticketData.mode = mode;

            const [ticket] = await Tickets.create([ticketData], { session });

            await ticket.populate([
                { path: "stadium", select: "stadiumName" },
                { path: "createdBy", select: "firstName lastName email" }
            ]);

            // AI Detection Mode Only runs if the user chose AI mode and skipped entirely for manual mode
            if (mode === "ai") {
                const baseUrl = `${req.protocol}://${req.get("host")}`;

                for (const imgUrl of ticketImages) {
                    const rawDetections = await processDetections(
                        `${baseUrl}${imgUrl}`,
                        modelType,
                        "image"
                    );

                    const detections = Array.isArray(rawDetections)
                        ? rawDetections
                        : Array.isArray(rawDetections?.detections)
                            ? rawDetections.detections
                            : [];

                    // If AI returned no detections, abort the entire transaction (the ticket will NOT be saved to the DB)
                    if (detections.length === 0) {
                        await session.abortTransaction();
                        session.endSession();
                        return res.status(422).json({
                            status: "error",
                            message: "AI model did not detect any results. Ticket was not saved. Please try again or switch to manual mode."
                        });
                    }

                    await Tickets.findByIdAndUpdate(
                        ticket._id,
                        { $push: { ticketDetections: { url: imgUrl, type: "image", modelType, detections } } },
                        { session }
                    );
                }

                for (const vidUrl of ticketVideos) {
                    const rawDetections = await processDetections(
                        `${baseUrl}${vidUrl}`,
                        modelType,
                        "video"
                    );

                    const detections = Array.isArray(rawDetections)
                        ? rawDetections
                        : Array.isArray(rawDetections?.detections)
                            ? rawDetections.detections
                            : [];

                    if (detections.length === 0) {
                        await session.abortTransaction();
                        session.endSession();
                        return res.status(422).json({
                            status: "error",
                            message: "AI model did not detect any results. Ticket was not saved. Please try again or switch to manual mode."
                        });
                    }

                    await Tickets.findByIdAndUpdate(
                        ticket._id,
                        { $push: { ticketDetections: { url: vidUrl, type: "video", modelType, detections } } },
                        { session }
                    );
                }
            }

            await session.commitTransaction();
            session.endSession();

            // send emails to admins and user
            const admins = await Admin.find().select("email");
            for (const admin of admins) {
                await EmailController.reportEmailToAdmin(admin.email, ticket);
            }
            await EmailController.reportEmailToUser(ticket.createdBy.email, ticket);

            const populatedTicket = await Tickets.findById(ticket._id);
            res.status(201).json({ status: "success", data: populatedTicket });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            next(error);
        }
    });

    //@decs  Get All Tickets
    //@route GET /tickets
    //@access Private
    getAllTickets = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Tickets.find(), req.query, "Ticket")
        .filter()
        .paginate()
        .sort()
        .cleanResponse();

        let tickets = await features.query;

        if (req.query.search) {
            const keyword = req.query.search.toLowerCase();
            tickets = tickets.filter(t =>
                t.area?.toLowerCase().includes(keyword) ||
                t.stadium?.stadiumName?.toLowerCase().includes(keyword) ||
                t.createdBy?.firstName?.toLowerCase().includes(keyword) ||
                t.createdBy?.lastName?.toLowerCase().includes(keyword)
            );
        }

        if (req.query.sort === "-priority") {
            const PRIORITY_ORDER = ["low", "medium", "hard", "critical"];
            tickets = tickets.sort((a, b) =>
                PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
            );
        }

        if (req.query.sort === "priority") {
            const PRIORITY_ORDER = ["low", "medium", "hard", "critical"];
            tickets = tickets.sort((a, b) =>
                PRIORITY_ORDER.indexOf(b.priority) - PRIORITY_ORDER.indexOf(a.priority)
            );
        }


        res.status(200).json({
            status: 'success',
            totalResults: tickets.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            tickets,
        });
    });

    //@decs  Get One Ticket
    //@route GET /tickets/:id
    //@access Private   
    getOneTicket = asyncHandler(async (req, res, next) => {
        const { id } = req.params

        const ticket = await Tickets.findById(id).select("-__v -updatedAt");
        if (!ticket) return next(new ApiError("Ticket not found", 404));
        res.status(200).json({ status: "success", ticket });
    });

    //@decs Get My Tickets
    //@route GET /tickets/my
    //@access Private
    getMyTickets = asyncHandler(async (req, res, next) => {

        const features = new ApiFeatures(Tickets.find({createdBy: req.user._id}), req.query, "Ticket")
            .filter()
            .paginate()
            .sort()
            .cleanResponse();

        let tickets = await features.query;

        if (req.query.search) {
            const keyword = req.query.search.toLowerCase();
            tickets = tickets.filter(t =>
                t.area?.toLowerCase().includes(keyword) ||
                t.stadium?.stadiumName?.toLowerCase().includes(keyword)
            );
        }

        res.status(200).json({
            status: 'success',
            totalResults: tickets.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            tickets,
        });
    });

    //@desc Update Ticket
    //@route PUT /tickets/:id
    //@access Public
    updateTicket = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const oldTicket = await Tickets.findById(id);
        if (!oldTicket) {
            return next(new ApiError(`Ticket Not Found`, 404));
        }

        if (oldTicket.status !== "open") {
            return next(new ApiError(`Ticket is ${oldTicket.status}. You can't update it`, 400));
        }

        if (req.body.ticketVideos) {
            const oldVideos = oldTicket.ticketVideos || [];
            const newVideos = req.body.ticketVideos || [];
            const videosToDelete = oldVideos.filter(oldVid => !newVideos.includes(oldVid));
            deleteFiles(videosToDelete, "videos");
        }

        if (req.body.ticketImages) {
            const oldImages = oldTicket.ticketImages || [];
            const newImages = req.body.ticketImages || [];
            const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
            deleteFiles(imagesToDelete, "images");
        }

        if (req.body.ticketVoices) {
            const oldAudios = oldTicket.ticketVoices || [];
            const newAudios = req.body.ticketVoices || [];
            const audiosToDelete = oldAudios.filter(oldAud => !newAudios.includes(oldAud));
            deleteFiles(audiosToDelete, "audios"); 
        }

        const ticket = await Tickets.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: "Ticket updated successfully",
            ticket
        });
    });

    //@desc Update Ticket
    //@route DELETE /tickets/:id
    //@access Public
    deleteTicket = asyncHandler(async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { id } = req.params;

            const ticket = await Tickets.findByIdAndDelete(id, { session });
            if (!ticket) {
                await session.abortTransaction();
                session.endSession();
                return next(new ApiError(`Ticket Not Found`, 404));
            }

            const stadium = await Stadium.findById(ticket.stadium).session(session);
            if (!stadium) {
                await session.abortTransaction();
                session.endSession();
                return next(new ApiError(`Stadium Not Found`, 404));
            }

            if (ticket.status !== "open") {
                await session.abortTransaction();
                session.endSession();
                return next(new ApiError(`Ticket is ${ticket.status}, You can't delete`, 400));
            }

            stadium.tickets.pull(ticket._id);
            await stadium.save({ session });

            deleteFiles(ticket.ticketImages, "images");
            deleteFiles(ticket.ticketVideos, "videos");
            deleteFiles(ticket.ticketVoices, "audios");

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                status: "success",
                message: "Ticket deleted successfully",
                ticket
            });

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            return next(err);
        }
    });

    //@desc assign or reject ticket
    //@route Patch /tickets/:id/status
    //@access Private
    assignOrRejectTicket = asyncHandler(async (req, res, next) => {
        const { status, assignedTo } = req.body;
        const { id } = req.params;

        const ticket = await Tickets.findById(id);
        if (!ticket) return next(new ApiError("Ticket not found", 404));

        if (ticket.status !== "open") {
            return next(new ApiError(`Ticket is ${ticket.status} You can't update`, 400));
        }

        if (!status && !assignedTo) {
            return next(new ApiError("Reject or assign ticket", 400));
        }

        if (assignedTo) {
            if (!mongoose.isValidObjectId(assignedTo))
                return next(new ApiError("Invalid team id", 400));

            if (status)
                return next(new ApiError("Can't assign and choose status at the same time", 400));

            const team = await Team.findById(assignedTo);
            if (!team) return next(new ApiError("Team not found", 404));

            if (team.teamType === "reports")
                return next(new ApiError("Can't assign to reports team", 400));

            ticket.assignedTo = assignedTo;
            ticket.assignedBy = req.user._id;
            ticket.status = "inProgress";
            await ticket.save();

            return res.status(200).json({
                status: "success",
                message: "Ticket assigned successfully",
                ticket,
            });
        }

        if (status !== "rejected") {
            return next(new ApiError("Only rejected status is allowed", 400));
        }

        ticket.status = "rejected";
        ticket.rejectedBy = req.user._id;
        await ticket.save();

        res.status(200).json({
            status: "success",
            message: "Ticket rejected successfully",
            ticket,
        });
    });

    //@desc Close The Ticket
    //@route Patch /tickets/:id/close
    //@access Private
    closeTicket = asyncHandler(async (req, res, next) => {
        const { id } = req.params
        const { status } = req.body
        if (!status) return next(new ApiError("Status is required", 400));
        if (status !== "closed") return next(new ApiError("Only closed status is allowed", 400));
        const ticket = await Tickets.findById(id);
        if (!ticket) return next(new ApiError("Ticket not found", 404));
        if (ticket.status !== "inProgress") return next(new ApiError(`Ticket is ${ticket.status} You can't close`, 400));
        ticket.closedBy = req.user._id;
        ticket.status = "closed";
        await ticket.save();
        res.json({
            status: "success",
            message: `Ticket closed successfully`,
            ticket
        })
    })

    //@desc Choose Priority
    //@route Patch /tickets/:id/priority
    //@access Private
    choosePriority = asyncHandler(async (req, res, next) => {
        const { id } = req.params
        const ticket = await Tickets.findById(id);
        if (!ticket) return next(new ApiError("Ticket not found", 404));
        if (ticket.priority === req.body.priority) return next(new ApiError(`Ticket is already ${ticket.priority}`, 400));
        
        ticket.priority = req.body.priority;
        await ticket.save();
        res.json({
            status: "success",
            message: `Ticket priority changed to ${ticket.priority} successfully`,
            ticket
        })
    })

    //@desc Toggle Visibility
    //@route Patch /tickets/:id/visibility
    //@access Private
    changeVisibility = asyncHandler(async (req, res, next) => {
        const { id } = req.params
        const ticket = await Tickets.findById(id);
        if (!ticket) return next(new ApiError("Ticket not found", 404));
        if (ticket.visibility === req.body.visibility) return next(new ApiError(`Ticket is already ${ticket.visibility}`, 400));
        
        ticket.visibility = req.body.visibility;
        await ticket.save();
        res.json({
            status: "success",
            message: `Ticket visibility changed to ${ticket.visibility} successfully`,
            ticket
        })
    })

    //@decs Upload Before and After Images
    //@route Patch /tickets/:id/before-after
    //@access Private
    uploadBeforeAfterImages = asyncHandler(async (req, res, next) => {
        console.log("RECEIVED BODY:", JSON.stringify(req.body, null, 2));
        const { id } = req.params;
        const ticket = await Tickets.findById(id);

        if (!ticket) return next(new ApiError("Ticket not found", 404));

        if (
            !req.body.beforeImages ||
            !req.body.afterImages
        ) {
            return next(new ApiError("Before and After images are required", 400));
        }

        ticket.beforeAfterImages.before = req.body.beforeImages;
        ticket.beforeAfterImages.after = req.body.afterImages;

        await ticket.save();

        res.json({
            status: "success",
            message: `Images uploaded successfully`,
            ticket
        });
    });

}


module.exports = new TicketsController();