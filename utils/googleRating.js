const axios = require("axios");

const getGoogleRating = async (placeName) => {
    try {
        const response = await axios.get(
            "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
            {
                params: {
                    input: placeName,
                    inputtype: "textquery",
                    fields: "rating,user_ratings_total",
                    key: process.env.GOOGLE_API_KEY
                }
            }
        );

        const candidate = response.data.candidates[0];

        if (!candidate) return { rating: 0, reviewsCount: 0 };

        return {
            rating: candidate.rating || 0,
            reviewsCount: candidate.user_ratings_total || 0
        };
    } catch (err) {
        console.error("Error fetching Google rating:", err.message);
        return { rating: 0, reviewsCount: 0 };
    }
};

module.exports = getGoogleRating;
