const extractLatLong = (url) => {
    try {
        if (!url) return null;
        url = url.trim();

        let regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        let matches = url.match(regex);

        if (matches && matches.length >= 3) {
            return {
                lat: parseFloat(matches[1]),
                long: parseFloat(matches[2])
            };
        }

        regex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
        matches = url.match(regex);
        if (matches && matches.length >= 3) {
            return {
                lat: parseFloat(matches[1]),
                long: parseFloat(matches[2])
            };
        }

        return null;
    } catch (error) {
        console.error("extractLatLong error:", error.message);
        return null;
    }
};

module.exports = extractLatLong;
