const { exec } = require("child_process");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const processDetections = async (url, modelType, fileType = "image") => {
    const ext = fileType === "video" ? ".mp4" : ".jpg";
    const tempFile = path.join(__dirname, "temp_" + Date.now() + ext);

    const writer = fs.createWriteStream(tempFile);
    const response = await axios({ url, method: "GET", responseType: "stream" });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    const pythonScript = modelType === "safety"
        ? path.resolve(__dirname, "..", "yoloModel", "safety", fileType === "video" ? "detect_video.py" : "detect_image.py")
        : path.resolve(__dirname, "..", "yoloModel", "visualPollution", fileType === "video" ? "detect_video.py" : "detect_image.py");

    if (!fs.existsSync(pythonScript)) {
        throw new Error(`Python script not found at path: ${pythonScript}`);
    }

    console.log("Running Python script at: ".green.bold + pythonScript.yellow.bold);

    const detections = await new Promise((resolve, reject) => {
        exec(`python "${pythonScript}" "${tempFile}"`, (err, stdout, stderr) => {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            } catch (unlinkErr) {
                console.error("Failed to delete temp file:", unlinkErr);
            }

            if (err) {
                console.error(stderr);
                return reject(err);
            }

            try {
                // Extract the last valid JSON line to avoid YOLO's stdout noise
                const lines = stdout.trim().split("\n");
                const jsonLine = lines
                    .reverse()
                    .find(
                        (line) =>
                            line.trim().startsWith("[") ||
                            line.trim().startsWith("{")
                    );

                if (!jsonLine) {
                    throw new Error(`No valid JSON found in stdout: ${stdout}`);
                }

                resolve(JSON.parse(jsonLine));
            } catch (parseErr) {
                console.error("Raw stdout was:", stdout);
                reject(new Error(`JSON parse failed. stdout: ${stdout}`));
            }
        });
    });

    return detections;
};

module.exports = processDetections;