const asyncHandler = require("express-async-handler");
const ApiError = require('../utils/ApiError');
const ApiFeatures = require("../utils/ApiFeatures");
const Tickets = require("../models/ticket.model");
const FirebaseController = require("./firebase.controller");

class TicketsController { 

    //@decs  Add Ticket
    //@route POST /tickets
    //@access Public
    addTicket = asyncHandler(async (req, res, next) => {
        const ticket = await Tickets.create(req.body);
        res.status(201).json({ status: "success", data: ticket });
    })

    //@decs  Get All Tickets
    //@route GET /tickets
    //@access Private
    getAllTickets = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Tickets.find(), req.query, "Ticket")
            .filter()
            .paginate()
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
        const tickets = await Tickets.find({ createdBy: req.user._id });
        if (!tickets) return next(new ApiError("Tickets not found", 404));
        res.status(200).json({ status: "success", tickets});
    })

    //@desc Update Ticket
    //@route PUT /tickets/:id
    //@access Public
    updateTicket = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const oldTicket = await Tickets.findById(id);
        if (!oldTicket) {
            return next(new ApiError(`Ticket Not Found`, 404));
        }
        
        if (oldTicket.status !== "open") return next(new ApiError(`Ticket is ${oldTicket.status} You can't update`, 400));

        if (req.body.ticketVideos) {
            const oldVideos = oldTicket.ticketVideos || [];
            const newVideos = req.body.ticketVideos || [];
            const videosToDelete = oldVideos.filter(oldVid => !newVideos.includes(oldVid));
            for (const video of videosToDelete) {
                await FirebaseController.deleteOldVideo(video, "ticketVideos");
            }
        }
        if (req.body.ticketImages) {
            const oldImages = oldTicket.ticketImages || [];
            const newImages = req.body.ticketImages || [];
            const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
            for (const image of imagesToDelete) {
                await FirebaseController.deleteOldImage(image, "ticketImages");
            }
        }

        const ticket = await Tickets.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: "success",
            message: "Tickets updated successfully",
            ticket
        });
    });

    //@desc Update Ticket
    //@route DELETE /tickets/:id
    //@access Public
    deleteTicket = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const ticket = await Tickets.findByIdAndDelete(id);
        if (!ticket) {
            return next(new ApiError(`Ticket Not Found`, 404));
        }

        if (ticket.ticketImages && ticket.ticketImages.length > 0) {
            for (const img of ticket.ticketImages) {
                await FirebaseController.deleteOldImage(img, "ticketsImages");
            }
        }

        if (ticket.ticketVideos && ticket.ticketVideos.length > 0) {
            for (const vid of ticket.ticketVideos) {
                await FirebaseController.deleteOldVideo(vid, "ticketVideos");
            }
        }

        res.status(200).json({
            status: "success",
            message: "Ticket deleted successfully",
            ticket
        });
    });
    
}


module.exports = new TicketsController();