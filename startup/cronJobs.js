const cron = require("node-cron");
const Stadium = require("../models/stadium.model");
const getGoogleRating = require("../utils/googleRating");
const { syncVenuesByCountry } = require("../utils/footballApi");

module.exports = () => {
    // cron.schedule("0 0 */14 * *", async () => {
    //     try {
    //         const stadiums = await Stadium.find();

    //         for (const stadium of stadiums) {
    //             const ratingData = await getGoogleRating(stadium.stadiumName);
    //             await Stadium.updateOne(
    //                 { _id: stadium._id },
    //                 {
    //                     rate: ratingData.rating,
    //                     reviewsQuantity: ratingData.reviewsCount
    //                 }
    //             );
    //         }

    //         console.log(`All stadium ratings updated successfully`.green.bold);
    //     } catch (error) {
    //         console.error("Error updating stadium ratings:", error.message.red);
    //     }
    // });

    cron.schedule("0 0 */14 * *", async () => {
        try {
            await syncVenuesByCountry("Saudi-Arabia");
        } catch (error) {
            console.error("Error syncing Saudi venues:", error.message.red);
        }
    });

    console.log("Cron jobs initialized".cyan.bold);
};