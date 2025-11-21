const asyncHandler = require('express-async-handler');
const City = require('../models/city.model');
const ApiFeatures = require('../utils/ApiFeatures');

class CityController {

  // @desc    Get all cities
  // @route   GET /cities
  // @access  Public
  getAllCities = asyncHandler(async(req, res, next) => {
      const features = new ApiFeatures(City.find(), req.query, "City")
      .search()
      .filter()
      .paginate()
      .cleanResponse();

    const cities = await features.query;

    res.status(200).json({
      status: 'success',
      totalResults: cities.length,
      pagination: {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
      },
      cities
    });
  })

  // @desc    Add new city
  // @route   POST /cities
  // @access  Private
  addCity = asyncHandler(async(req, res, next) => {
    const city = await City.create(req.body);

    res.status(201).json({
      status: 'success',
      message: "City added successfully",
      data: {
        city
      }
    });
  })

  // @desc    Update city
  // @route   PATCH /cities/:id
  // @access  Private
  updateCity = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    const city = await City.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      message: "City updated successfully",
      data: {
        city
      }
    });
  })

  // @desc    Delete city
  // @route   DELETE /cities/:id
  // @access  Private
  deleteCity = asyncHandler(async(req, res, next) => {
    const { id } = req.params;
    await City.findByIdAndDelete(id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  })
}

module.exports = new CityController();