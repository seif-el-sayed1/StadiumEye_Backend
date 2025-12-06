const dotenv = require("dotenv");
dotenv.config();

const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { storage } = require("../startup/firebase");

const { ref, getDownloadURL, uploadBytesResumable, deleteObject } = require("firebase/storage");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");

let folderName;

/**
 * Uploads the given image to Firebase Storage and returns the download URL
 * of the uploaded image
 * @param {Buffer} image The image to be uploaded
 * @returns {Promise<string>} The download URL of the uploaded image
 */
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

/**
 * Uploads the given document to Firebase Storage and returns the download URL
 * of the uploaded document
 *
 * @param {Buffer} document The document to be uploaded
 * @param {string} baseName The base name of the document
 * @param {string} innerName The inner name of the document
 * @returns {Promise<string>} The download URL of the uploaded document
 */
const uploadDocumentAndGetUrl = async (document, baseName, innerName) => {
  // Upload Document
  const storageRef = ref(
    storage,
    `${folderName}/${`document(${baseName},${innerName})-${uuidv4()}-${Date.now()}-${folderName.toLowerCase()}.pdf`}`
  );
  const metadata = { contentType: "application/pdf" };
  // Add image download URL to request body
  const snapshot = await uploadBytesResumable(storageRef, document.buffer, metadata);
  return await getDownloadURL(snapshot.ref);
};


/**
 * Uploads the given video to Firebase Storage and returns the download URL
 * of the uploaded video
 * @param {Buffer} video The video to be uploaded
 * @returns {Promise<string>} The download URL of the uploaded video
 */
const uploadVideoAndGetUrl = async (video) => {
    // Upload video
    const storageRef = ref(
        storage,
        `${folderName}/video-${uuidv4()}-${Date.now()}-${folderName.toLowerCase()}.mp4`
    );
    const metadata = { contentType: "video/mp4" };
    const snapshot = await uploadBytesResumable(storageRef, video.buffer, metadata);
    return await getDownloadURL(snapshot.ref);
};

const uploadVoiceAndGetUrl = async (voice) => {
    const storageRef = ref(
        storage,
        `${folderName}/voice-${uuidv4()}-${Date.now()}-${folderName.toLowerCase()}.mp3`
    );
    const metadata = { contentType: "audio/mpeg" };
    const snapshot = await uploadBytesResumable(storageRef, voice.buffer, metadata);
    return await getDownloadURL(snapshot.ref);
};

/**
 * Deletes a video from Firebase Storage using its URL.
 *
 * @param {string} fileUrl - The URL of the video to be deleted.
 * @param {string} folderName - The name of the folder where the video is stored.
 * @returns {Promise<boolean>} - Returns true if the video is successfully deleted, otherwise false.
 */
const deleteVideoByUrl = async (fileUrl, folderName) => {
    try {
        const fullPath = new URL(fileUrl).pathname;
        const startIndex = fullPath?.indexOf("video-");
        const fileName = fullPath.substring(startIndex);
        const storageRef = ref(storage, `${folderName}/${fileName}`);
        await deleteObject(storageRef);
        return true;
    } catch (error) {
        console.log("🚀 ~ deleteVideoByUrl ~ error:", error);
        return false;
    }
};

const deleteVoiceByUrl = async (fileUrl, folderName) => {
    try {
        const fullPath = new URL(fileUrl).pathname;
        const startIndex = fullPath?.indexOf("voice-");
        const fileName = fullPath.substring(startIndex);
        const storageRef = ref(storage, `${folderName}/${fileName}`);
        await deleteObject(storageRef);
        return true;
    } catch (error) {
        console.log("🚀 ~ deleteVoiceByUrl ~ error:", error);
        return false;
    }
};


/**
 * Deletes an image from Firebase Storage using its URL.
 *
 * @param {string} fileUrl - The URL of the image to be deleted.
 * @param {string} folderName - The name of the folder where the image is stored.
 * @returns {Promise<boolean>} - Returns true if the image is successfully deleted, otherwise false.
 */

const deleteImageByUrl = async (fileUrl, folderName) => {
  try {
    folderName = folderName;
    const fullPath = new URL(fileUrl).pathname;
    const startIndex = fullPath?.indexOf("image-");
    const fileName = fullPath.substring(startIndex);
    const storageRef = ref(storage, `${folderName}/${fileName}`);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.log("🚀 ~ deleteImageByUrl ~ error:", error);
    return false;
  }
};
/**
 * Deletes a document from Firebase Storage using its URL.
 *
 * @param {string} fileUrl - The URL of the document to be deleted.
 * @param {string} folderName - The name of the folder where the document is stored.
 * @returns {Promise<boolean>} - Returns true if the document is successfully deleted, otherwise false.
 */
const deleteDocumentUrl = async (fileUrl, folderName) => {
  try {
    folderName = folderName;
    const fullPath = new URL(fileUrl).pathname;
    console.log("🚀 ~ deleteDocumentUrl ~ fullPath:", fullPath);
    const startIndex = fullPath?.indexOf("document");
    const fileName = fullPath.substring(startIndex);
    // console.log("🚀 ~ deleteDocumentUrl ~ fileName:", fileName);
    const storageRef = ref(storage, `${folderName}/${fileName}`);
    console.log(`🚀 ~ deleteDocumentUrl ~ {folderName}/{fileName}: ${folderName}/${fileName}`);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.log("error");
    return false;
  }
};

class FirebaseImageController {

  uploadMultipleImagesForTheUser = (modelName) =>
    asyncHandler(async (req, res, next) => {
      const lang = req.headers.lang || "en";
      // console.log("🚀 ~ Req.body ~ in upload Multiple Images in firebase", req.files);
      folderName = `${modelName}`;
      const { files } = req;
      const { photos } = req.body;
      // console.log(files);
      if (!files) return next();
      else {
        // console.log(photos);
        if (files.length > 0) {
          let photosWithCaptions = [];
          for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.fieldname.includes("photos")) {
              let url = await uploadImageAndGetUrl(file);
              photosWithCaptions.push({
                url,
                caption: photos ? photos[i]?.caption : undefined
              });
            } else if (file.fieldname === "profilePicture") {
              req.body.profilePicture = await uploadImageAndGetUrl(file);
            } else if (file.fieldname === "nationalId") {
              let extName = file.originalname.split(".")[1]; // extract extension name of the file
              let validPdf = file.mimetype.includes("pdf"); // get the file mimeType
              // Check on mimeType and file extension
              if (extName.toLowerCase() !== "pdf")
                return next(new ApiError(translate("Invalid File Format or Not a Valid PDF", lang), 400));
              req.body.nationalId = await uploadDocumentAndGetUrl(
                file,
                req.user.firstName || req.user.entityName,
                req.user.lastName || req.user.ownerName
              );
            }
          }
          if (photosWithCaptions.length > 0) req.body.photos = photosWithCaptions;
        }
      }
      next();
    });

  uploadMultipleImages = (modelName) =>
    asyncHandler(async (req, res, next) => {
      folderName = modelName;
      const { files } = req;
      let fieldName;
      if (files && files.length > 0) {
        const photosByField = {}; 
        await Promise.all(
            files.map(async (file) => {
                if (file.fieldname?.toLowerCase()?.includes("images")) {
                    if (!photosByField[file.fieldname]) photosByField[file.fieldname] = [];
                    photosByField[file.fieldname].push(await uploadImageAndGetUrl(file));
                }
            })
        );

        for (const key in photosByField) {
            req.body[key] = photosByField[key];
        }
    }
      next();
  });

  uploadSingleImage = (modelName) =>
    asyncHandler(async (req, res, next) => {
      folderName = modelName;
      const files = req.files;
      const file = req.file;
      if (!files && !file) return next(); // if image is not sent then skip this middleware (user image is optional)
      if (req.files?.length > 0) {
        return next();
      } else if (file) req.body.image = await uploadImageAndGetUrl(file);
      next();
    });

  uploadFile = (modelName) =>
    asyncHandler(async (req, res, next) => {
      folderName = modelName;
      const file = req.file;
      // console.log("in upload image=>", file);
      if (!file) return next(); // if image is not sent then skip this middleware (user image is optional)
      req.body.document = await uploadDocumentAndGetUrl(
        file,
        req.body.entityName,
        req.body.ownerName
      );
      next();
      return;
    });

  uploadMultipleVideos = (modelName) =>
    asyncHandler(async (req, res, next) => {
        folderName = modelName;
        const { files } = req;
        let fieldName;

        if (files && files.length > 0) {
            let videosPromise = [];

            await Promise.all(
                files.map(async (file) => {
                    if (file.fieldname?.toLowerCase()?.includes("videos")) {
                        fieldName = file.fieldname;
                        console.log(fieldName)
                        videosPromise.push(uploadVideoAndGetUrl(file));
                    }
                })
            );

            if (videosPromise.length > 0) {
                req.body[fieldName] = await Promise.all(videosPromise);
            }
        }

        next();
    });

  uploadMultipleVoices = (modelName) =>
    asyncHandler(async (req, res, next) => {
        folderName = modelName;
        const { files } = req;
        let fieldName;

        if (files && files.length > 0) {
            let voicesPromise = [];

            await Promise.all(
                files.map(async (file) => {
                    if (file.fieldname?.toLowerCase()?.includes("voices")) {
                        fieldName = file.fieldname;
                        voicesPromise.push(uploadVoiceAndGetUrl(file));
                    }
                })
            );

            if (voicesPromise.length > 0) {
                req.body[fieldName] = await Promise.all(voicesPromise);
            }
        }

        next();
    });



    uploadSingleVideo = (modelName, fieldName) =>
        asyncHandler(async (req, res, next) => {
            folderName = modelName;
            const file = req.file;
            console.log(file)
            if (!file) return next();
            req.body.stadiumVideos = await uploadVideoAndGetUrl(file);
            next();
        });

    deleteOldVideo = async (video, folderName) => await deleteVideoByUrl(video, folderName);

    deleteOldVoice = async (voice, folderName) => await deleteVoiceByUrl(voice, folderName);

  /**
   *
   * Deletes Image By URL And folderName
   * @param {String} image a url link to be deleted
   * @param {String} folderName the folder where the image is saved on firebase
   * @returns true or false
   */
  deleteOldImage = async (image, folderName) => await deleteImageByUrl(image, folderName);

  /**
   *
   * Deletes Document By URL And folderName
   * @param {String} document a url link to be deleted
   * @param {String} folderName the folder where the image is saved on firebase
   * @returns true or false
   */
  deleteOldDocument = async (document, folderName) => await deleteDocumentUrl(document, folderName);

  rollbackNewUserImage = asyncHandler(
    async (req, res, next) => await deleteImageByUrl(req.body.image)
  );

  // Notifications
  addNotificationImage = asyncHandler(async (req, res, next) => {
    folderName = "Notification";
    if (req.file) req.body.image = await uploadImageAndGetUrl(req.file);
    return;
  });

  deleteOldNotificationImage = asyncHandler(
    async (req) => await deleteImageByUrl(req.oldImage, "Notification")
  );

  rollbackNotificationImage = asyncHandler(
    async (req) => await deleteImageByUrl(req.body.image, "Notification")
  );

}

module.exports = new FirebaseImageController();
