var express = require("express");
var router = express.Router();
const jsend = require("jsend");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const { validate: uuidValidate } = require("uuid");

//Db and services:
const db = require("../models");
const ImageService = require("../services/ImageService");
const imageService = new ImageService(db);
const { upload, uploadImage, deleteImage, getAllImages, } = require("../services/S3Service.js");
//middleware:
const { validateUserId, validateFileInfo, validateImageId, validateImage, validateKey, } = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const { notFoundError, notProvidedError, deleteError, uploadError, notValidError, imageProcessingError, } = require("../utils/hoc");
const { encodeImageToBlurhash, resizeImage } = require("../utils/imageProcessor");

router.use(jsend.middleware);

//get all
router.get("/", async function (req, res, next) {
  //get s3 signed image urls
  let imageUrls = null;
  try {
    imageUrls = await getAllImages();
  } catch (err) {
    return notFoundError("Error:" + err.message + " Images", res);
  }

  // Encode Urls
  const encodedUrls = await imageUrls?.map((obj) => encodeURI(obj));

  //get image data from db
  let imageData = null;
  try {
    imageData = await imageService.getAll();
  } catch (err) {
    return notFoundError("Error:" + err.message + " Image Data", res);
  }

  if (!imageData || !encodedUrls) {
    return notFoundError("images", res);
  }

  const result = {
    encodedUrls: encodedUrls,
    imageData: imageData,
  };

  return res.jsend.success({ result: result, message: "retrieved all images" });
});

//upload image
router.post(
  "/:imageId",
  authorize,
  upload.single("image"),
  validateUserId,
  // validateImageId(uuidValidate),
  validateFileInfo,
  validateImage,
  async (req, res, next) => {
    const { file } = req;
    const { title, subtitle, text } = req.body;
    const {imageId} = req.params;
    console.log('--this is req.file after upload:',file)

    if (!file) return notProvidedError("file", res);
    if (!imageId) return notProvidedError("imageId", res);

    // encode to blurhash
    let imageBlurHash;
    try {
      imageBlurHash = await encodeImageToBlurhash(file.path);
      console.log('--imageBlurHash',imageBlurHash);
    } catch (error) {
      console.log(error.message)
      imageProcessingError('Cannot make blurhash');
    }

    //resize
    let resized;
    try {
      resized = await resizeImage(file.path);
      console.log('--resized',resized);
    } catch (error) {
      console.log(error.message);
      imageProcessingError('Cannot resize');
    }

    if(Buffer.isBuffer(resized)===false) {
      return notValidError('Buffer',res)
    }

    // upload to s3
    let s3_image = null;
    try {
      s3_image = await uploadImage(resized, imageId);
      console.log(s3_image);
    } catch (error) {
      return res.jsend.fail({
        result: {},
        message: `Error uploading image to s3`,
        error: error.message,
      });
    }

    if(!s3_image) {
      return notValidError('file', res);
    }

    let db_image = null;
    try {
      db_image = await imageService.create(
        imageId,
        imageBlurHash, //this is the name?
        title,
        subtitle,
        text
      );
      console.log('db_image:',db_image);
    } catch (err) {
      return res.jsend.fail({
        result: {},
        message: `Error uploading image: ${file.originalname}`,
        error: err.message,
      });
    }

    if (!db_image) {
      return uploadError("image to db.", res);
    }

    return res.jsend.success({
      result: {
        db_image: db_image,
      },
      message: "successfully uploaded image",
    });
  }
);

//delete image
router.delete(
  "/:key",
  jsonParser,
  authorize,
  validateUserId,
  // validateKey(uuidValidate),
  async function (req, res, next) {
    const { key } = req.params; //this is now the key

    //delete from db
    let deleted_db = null;
    try {
      deleted_db = await imageService.deleteOne(key);
      console.log('deleted_db1',deleted_db);
    } catch (err) {
      console.log(err);
      return res.jsend.fail({
        result: { deleted_db: deleted_db },
        message: `unable to delete image with id: ${key}`,
        error: err.message,
      });
    }

    //if not deleted - error
    if (!deleted_db) {
      console.log('deletedDb2:',deleted_db);
      return deleteError("image from database", res);
    }

    //delete from s3
    let deleted_s3 = null;
    try {
      deleted_s3 = await deleteImage(key);
    } catch (err) {
      console.log(err);
      return res.jsend.fail({
        result: {},
        message: `unable to delete image with id: ${key}`,
        error: err.message,
      });
    }

    console.log("deleteds3", deleted_s3);

    if (!deleted_s3) {
      return deleteError("image from AWS s3", res);
    }

    return res.jsend.success({
      result: { deleted_db: deleted_db ? true : false },
      message: "image deleted",
    });
  }
);

module.exports = router;
