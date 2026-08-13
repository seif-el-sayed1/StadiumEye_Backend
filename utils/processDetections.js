const { exec } = require("child_process");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const MODEL_TYPES = ["safety", "visualPollution"];

const runModel = (modelType, fileType, tempFile) => {
    const pythonScript = path.resolve(
        __dirname,
        "..",
        "yoloModel",
        modelType,
        fileType === "video" ? "detect_video.py" : "detect_image.py"
    );

    if (!fs.existsSync(pythonScript)) {
        throw new Error(`Python script not found at path: ${pythonScript}`);
    }

    console.log("Running Python script at: ".green.bold + pythonScript.yellow.bold);

    return new Promise((resolve, reject) => {
        exec(`python "${pythonScript}" "${tempFile}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(stderr);
                return reject(err);
            }

            try {
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
};

const processDetections = async (url, fileType = "image") => {
    const ext = fileType === "video" ? ".mp4" : ".jpg";
    const tempFile = path.join(__dirname, "temp_" + Date.now() + ext);

    const writer = fs.createWriteStream(tempFile);
    const response = await axios({ url, method: "GET", responseType: "stream" });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    let allDetections = [];

    try {
        const results = await Promise.allSettled(
            MODEL_TYPES.map((modelType) => runModel(modelType, fileType, tempFile))
        );

        results.forEach((result, i) => {
            const modelType = MODEL_TYPES[i];

            if (result.status === "fulfilled") {
                const detections = Array.isArray(result.value) ? result.value : [];
                detections.forEach((d) => allDetections.push({ ...d, modelType }));
            } else {
                console.error(`Detection failed for model "${modelType}":`, result.reason.message);
            }
        });
    } finally {
        try {
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        } catch (unlinkErr) {
            console.error("Failed to delete temp file:", unlinkErr);
        }
    }

    return allDetections;
};

module.exports = processDetections;