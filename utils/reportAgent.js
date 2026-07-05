const { spawn } = require("child_process");

const PYTHON_BIN = "/var/www/StadiumEye/StadiumEye_Backend-main/venv/bin/python";
const SCRIPT_PATH = "/var/www/StadiumEye/StadiumEye_Backend-main/reportAgent/test.py";

const runReportAgent = (type, value) => {
    return new Promise((resolve, reject) => {
        const flagMap = { text: "--text", audio: "--audio", image: "--image" };
        const flag = flagMap[type];
        if (!flag) return reject(new Error(`Unsupported reportAgent type: ${type}`));

        const child = spawn(PYTHON_BIN, [SCRIPT_PATH, flag, value]);

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
        child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

        child.on("close", (code) => {
            if (code !== 0) return reject(new Error(`reportAgent exited with code ${code}: ${stderr}`));
            try {
                resolve(JSON.parse(stdout.trim()));
            } catch (err) {
                reject(new Error(`Failed to parse reportAgent output: ${err.message}\nRaw: ${stdout}`));
            }
        });

        child.on("error", reject);
    });
};

const mapTextDetectionResult = (raw, sourceType, sourceValue) => {
    const td = raw?.textDetection ?? raw;
    if (!td) return null;

    return {
        sourceType,
        sourceValue,
        ticketId: td.ticket_id,
        status: td.status,
        error: td.error,
        classification: td.classification,
        summary: td.summary,
        extractedText: td.extracted_text,
    };
};

module.exports = { runReportAgent, mapTextDetectionResult };