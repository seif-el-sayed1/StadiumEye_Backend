const axios = require("axios");

const API_BASE = "https://v3.football.api-sports.io";

const apiClient = axios.create({
    baseURL: API_BASE,
    headers: {
        "x-apisports-key": process.env.API_FOOTBALL_KEY
    }
});


const findVenueByName = async (name, country) => {
    const { data } = await apiClient.get("/venues", {
        params: { name, ...(country && { country }) }
    });

    if (data?.errors && Object.keys(data.errors).length > 0) {
        console.error("API-Football venues error:", data.errors);
        return null;
    }

    if (!data?.response?.length) return null;
    return data.response[0];
};

const findFixtureByVenueAndDate = async (venueId, date) => {
    const { data } = await apiClient.get("/fixtures", {
        params: { venue: venueId, date }
    });

    if (data?.errors && Object.keys(data.errors).length > 0) {
        console.error("API-Football fixtures error:", data.errors);
        return null;
    }

    if (!data?.response?.length) return null;
    return data.response[0];
};

module.exports = {
    findVenueByName,
    findFixtureByVenueAndDate
};