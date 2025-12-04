const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");
const Team = require("../models/teams.model");


class TeamController {
    //@desc Add Teams
    //@route POST /teams
    //@access Private
    addTeam = asyncHandler(async (req, res, next) => {
        const { teamName, teamType } = req.body

        if (!teamName || !teamType) {
            return next(new ApiError("Team name and team type are required", 400))
        };

        const team = await Team.create({ teamName, teamType })

        res.status(201).json({
            status: 'success',
            message: "Team added successfully",
            data: {
                team
            }
        });
    }) 

    //@desc Get All Teams
    //@route GET /teams
    //@access Private
    getAllTeams = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Team.find(), req.query, "Team")
            .search()
            .filter()
            .paginate()
            .cleanResponse();

        const teams = await features.query; 

        res.status(200).json({
            status: 'success',
            totalResults: teams.length,
            pagination: {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            },
            teams
        });
    })

    //@desc Get One Team 
    //@route GET /teams/:id
    //@access Private
    getOneTeam = asyncHandler(async (req, res, next) => {
        const team = await Team.findById(req.params.id).select("-__v -updatedAt");
        if (!team) return next(new ApiError("Team not found", 404));
        res.status(200).json({
            status: 'success',
            team
        });
    })
}

module.exports = new TeamController();