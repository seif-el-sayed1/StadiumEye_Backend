const multer = require("multer");
const ApiError = require("../utils/ApiError");
const multerStorage = multer.memoryStorage();
const { translate } = require("../utils/translation");

// filter image
const multerFilterForImage = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "application/octet-stream"
  )
    cb(null, true);
  else
    cb(new ApiError(translate("Not an image, please upload only Image", req.headers.lang), 400), false);
};

// filter PDF
const multerFilterForPDF = (req, file, cb) => {
  if (file.mimetype === "application/pdf" || file.mimetype === "application/octet-stream")
    cb(null, true); // Accept the file
  else cb(new ApiError( translate("Not a PDF, please upload only PDFs", req.headers.lang), 400), false);
};
// filter videos
const multerFilterForVideo = (req, file, cb) => {
    if (
        file.mimetype.startsWith("video")
    ) cb(null, true);
    else cb(new ApiError(translate("Not a video, please upload only Video", req.headers.lang), 400), false);
};

// filter for both images and videos
const multerFilterForImageAndVideo = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype.startsWith("video")
  ) cb(null, true);
  else cb(new ApiError("Unsupported file type", 400), false);
};

const imageConfiguration = multer({
  storage: multerStorage,
  fileFilter: multerFilterForImage,
  limits: { fileSize: 10 * 1024 * 1024 } // Set the limit to 10MB
});

const PDFConfiguration = multer({
  storage: multerStorage,
  fileFilter: multerFilterForPDF,
  limits: { fileSize: 10 * 1024 * 1024 } // Set the limit to 10MB
});

const VideoConfiguration = multer({
    storage: multerStorage,
    fileFilter: multerFilterForVideo,
    limits: { fileSize: 50 * 1024 * 1024 } // Set the limit to 50MB
});

const uploadMediaConfiguration = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith("image");
        const isVideo = file.mimetype.startsWith("video");

        if (!isImage && !isVideo)
            return cb(new Error("Only images or videos allowed"), false);

        req.fileType = isImage ? "image" : "video";
        cb(null, true);
    },
    limits: {
        fileSize: (req, file) => {
            return file.mimetype.startsWith("image")
                ? 10 * 1024 * 1024       // 10MB
                : 50 * 1024 * 1024;      // 50MB
        }
    }
});


const uploadAnyImages = imageConfiguration.any([
  { name: "profilePicture", maxCount: 1 },
  { name: "stadiumImages", maxCount: 10 },
  { name: "photos", maxCount: 10 },
  {
    name: "photos",
    type: "array",
    maxCount: 10,
    items: { name: "image", maxCount: 1 }
  }
]);

const uploadMultipleVideos = VideoConfiguration.any([
    { name: "stadiumVideos", maxCount: 10 }
]);

const uploadMedia = uploadMediaConfiguration.any([
  { name: "stadiumImages", maxCount: 10 },
  { name: "stadiumVideos", maxCount: 10 }
]);


const uploadSingleVideo = (fileKey) => VideoConfiguration.single(fileKey);


const uploadSingleImage = (fileKey) => imageConfiguration.single(fileKey);

const uploadSingleFile = (fileKey) => PDFConfiguration.single(fileKey);

module.exports = {
  uploadAnyImages,
  uploadSingleImage,
  uploadSingleFile,
  uploadSingleVideo,
  uploadMultipleVideos,
  uploadMedia
};
