const dotenv = require("dotenv");
dotenv.config();

const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
require("../startup/firebase");

const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject
} = require("firebase/storage");

const storage = getStorage();

let folderName;

exports.firebaseUpload = (modelName) =>
  asyncHandler(async (req, res, next) => {
    folderName = modelName;
    try {
      if (req.file) {
        const image = req.file;
        req.body.url = await uploadImageAndGetUrl(image);
      }
      if (req.files?.length > 0) {
        let urlsPromise = req.files.map(async (file) => await uploadImageAndGetUrl(file));
        let urls = await Promise.all(urlsPromise);
        //.then(res => console.log(res))
        req.body.urls = urls;
        next();
      } else next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

const uploadImageAndGetUrl = async (image) => {
  // Downgrade image quality
  const processedImageBuffer = await sharp(image.buffer)
    .toFormat("jpeg")
    .jpeg({ quality: 80 })
    .toBuffer();
  // Upload image
  const storageRef = ref(
    storage,
    `${folderName}/${`image-${uuidv4()}-${Date.now()}-${folderName.toLowerCase()}.jpeg`}`
  );
  const metadata = { contentType: "image/jpeg" };
  // Add image download URL to request body
  const snapshot = await uploadBytesResumable(storageRef, processedImageBuffer, metadata);
  return await getDownloadURL(snapshot.ref);
};

exports.firebaseDelete = async (fileUrl) => {
  try {
    const fullPath = new URL(fileUrl).pathname;
    const startIndex = fullPath.indexOf("image-");
    const fileName = fullPath.substring(startIndex);
    const storageRef = ref(storage, `${folderName}/${fileName}`);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    return false;
  }
};
