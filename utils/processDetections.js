const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const processDetections = async (fileUrl, modelType, fileType = "image") => {
    const ext = fileType === "video" ? ".mp4" : ".jpg";
    const tempFile = path.join(__dirname, "temp_" + Date.now() + ext);

    const writer = fs.createWriteStream(tempFile);
    const response = await axios({ url: fileUrl, method: "GET", responseType: "stream" });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    const serviceUrl = "http://localhost:8000/detect"; 

    const formData = new FormData();
    formData.append("file", fs.createReadStream(tempFile));
    formData.append("modelType", modelType);
    formData.append("fileType", fileType);

    const res = await axios.post(serviceUrl, formData, {
        headers: formData.getHeaders()
    });

    fs.unlinkSync(tempFile);
    return res.data.detections;
};

module.exports = processDetections;
