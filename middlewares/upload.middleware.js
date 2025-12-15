const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
const path = require("path");
const fs = require("fs");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.mimetype.startsWith("image")) folder = "uploads/images";
    else if (file.mimetype.startsWith("video")) folder = "uploads/videos";
    else if (file.mimetype === "application/pdf") folder = "uploads/files";
    else if (file.mimetype.startsWith("audio")) folder = "uploads/audios";

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});


// Image filter
const multerFilterForImage = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream"
  ) cb(null, true);
  else
    cb(
      new ApiError(
        translate("Not an image, please upload only Image", req.headers.lang),
        400
      ),
      false
    );
};

// PDF filter
const multerFilterForPDF = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream"
  ) cb(null, true);
  else
    cb(
      new ApiError(
        translate("Not a PDF, please upload only PDFs", req.headers.lang),
        400
      ),
      false
    );
};

// Video filter
const multerFilterForVideo = (req, file, cb) => {
  if (file.mimetype.startsWith("video")) cb(null, true);
  else
    cb(
      new ApiError(
        translate("Not a video, please upload only Video", req.headers.lang),
        400
      ),
      false
    );
};

const imageConfiguration = multer({
  storage: multerStorage,
  fileFilter: multerFilterForImage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const PDFConfiguration = multer({
  storage: multerStorage,
  fileFilter: multerFilterForPDF,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const VideoConfiguration = multer({
  storage: multerStorage,
  fileFilter: multerFilterForVideo,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const uploadMediaConfiguration = multer({
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image");
    const isVideo = file.mimetype.startsWith("video");
    const isAudio = file.mimetype.startsWith("audio");

    if (!isImage && !isVideo && !isAudio)
      return cb(
        new ApiError("Only images, videos or voice allowed", 400),
        false
      );

    req.fileType = isImage ? "image" : isVideo ? "video" : "voice";
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});


const uploadAnyImages = imageConfiguration.any([
  { name: "profilePicture", maxCount: 1 },
  { name: "stadiumImages", maxCount: 10 },
  { name: "beforeImages", maxCount: 5 },
  { name: "afterImages", maxCount: 5 }
]);

const uploadMultipleVideos = VideoConfiguration.any([
  { name: "stadiumVideos", maxCount: 10 }
]);

const uploadMedia = uploadMediaConfiguration.any([
  { name: "stadiumImages", maxCount: 10 },
  { name: "stadiumVideos", maxCount: 10 },
  { name: "ticketImages", maxCount: 10 },
  { name: "ticketVideos", maxCount: 10 },
  { name: "ticketVoices", maxCount: 10 }
]);

const uploadSingleImage = (fileKey) => imageConfiguration.single(fileKey);
const uploadSingleVideo = (fileKey) => VideoConfiguration.single(fileKey);
const uploadSingleFile = (fileKey) => PDFConfiguration.single(fileKey);

module.exports = {
  uploadAnyImages,
  uploadSingleImage,
  uploadSingleFile,
  uploadSingleVideo,
  uploadMultipleVideos,
  uploadMedia
};
