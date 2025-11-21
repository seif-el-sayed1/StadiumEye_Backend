const asyncHandler = require("express-async-handler");
const Country = require("../models/country.model");
const ApiFeatures = require("../utils/ApiFeatures");


class CountryController {
    // @desc   Get all countries
    // @route  GET /countries
    // @access  Public
    getAllCountries = asyncHandler(async (req, res, next) => {
        const features = new ApiFeatures(Country.find(), req.query, "Country")
            .search()
            .filter()
            .paginate();

        const countries = await features.query;

        res.status(200).json({
            status: 'success',
            pagination: {
                page: req.query.page,
                limit: req.query.limit,
            },
            data: {
                countries,
            },
        });
    })

    // @desc    Add new country
    // @route   POST /countries
    // @access  Private
    addCountry = asyncHandler(async (req, res, next) => {
        const country = await Country.create(req.body);

        res.status(201).json({
            status: 'success',
            message: "Country added successfully",
            data: {
                country
            }
        });
    })

    // @desc    Update country
    // @route   PATCH /countries/:id
    // @access  Private
    updateCountry = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const country = await Country.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            message: "Country updated successfully",
            data: {
                country
            }
        });
    })

    // @desc    Delete country
    // @route   DELETE /countries/:id
    // @access  Private
    deleteCountry = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        await Country.findByIdAndDelete(id);

        res.status(200).json({
            status: 'success',
            message: "Country deleted successfully"
        });
    })
}

module.exports = new CountryController();