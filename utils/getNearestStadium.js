const Stadium = require("../models/stadium.model");

/**
 * @param {{lat: number, long: number}} latLong
 * @returns {object|null}
 */
const getNearestStadium = async (latLong) => {
    const [nearestStadium] = await Stadium.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [latLong.long, latLong.lat] },
                distanceField: "distance",
                spherical: true,
                query: { isActive: true, "location.coordinates": { $ne: [0, 0] } }
            }
        },
        { $limit: 1 }
    ]);

    return nearestStadium || null;
};

module.exports = getNearestStadium;