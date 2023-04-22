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
const {
  uploadImage,
  deleteImage,
  getAllImages,
  getOneImage,
} = require("../services/s3Service");

//middleware:
const {
  validateUserId,
  validateFileInfo,
  validateImageId,
  validateImage,
} = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const { notFoundError, notProvidedError } = require("../utils/hoc");

router.use(jsend.middleware);


//get all
router.get("/", async function (req, res, next) {

  //get s3 signed image urls
  let imageUrls = null;
  try {
    imageUrls = await getAllImages();
    console.log("--s3 response:", imageUrls);
  } catch (err) {
    notFoundError("Error:" + err.message + " Images", res);
    console.error(err.message);
  }

  // Encode Urls
  const encodedUrls = await imageUrls?.map((obj) => encodeURI(obj));

  //get image data from db
  let imageData = null;
  try {
    imageData = await imageService.getAll();
    console.log("--image data response:", imageData);
  } catch (err) {
    notFoundError("Error:" + err.message + " Image Data", res);
    console.error(err.message);
  }

  const result = {
    encodedUrls: encodedUrls,
    imageData: imageData,
  };
  console.log(result);

  res.jsend.success({ result: result, message: "retrieved all images" });
});

//upload image - must implement MIDDLEWARE:
//validateImageType
//validateImageExtension,
//validateImageObject,


router.post(
  "/:imageId",
  authorize,
  uploadImage.single("image"),
  validateUserId,
  validateImageId(uuidValidate),
  validateFileInfo,
  validateImage,
  async (req, res, next) => {
    const { file } = req;
    const { imageId } = req.params; // add id as uuid to front-end.
    const { title, subtitle, text } = req.body;
    console.log("--req.file:", file);
    console.log("--req.imageId:", imageId);
    console.log("--req.body:", title, subtitle, text);

    if (!file) notProvidedError("file", res);

    let db_image;
    try {
      db_image = await imageService.create(
        imageId,
        file.originalname,
        file.location,
        title,
        subtitle,
        text
      );
      console.log("--db-saved-img:", db_image);
    } catch (err) {
      console.error(`Error uploading image: ${err.message}`);
      return res.jsend.fail({
        result: {},
        message: `Error uploading image: ${file.originalname}`,
        error: err.message,
      });
    }

    res.jsend.success({
      result: {
        db_image: db_image,
      },
      message: "successfully uploaded image",
    });
  }
);

//delete image
router.delete(
  "/:imageId",
  jsonParser,
  authorize,
  validateUserId,
  validateImageId(uuidValidate),
  async function (req, res, next) {
    const { userId } = req;
    const { imageId } = req.params;
    const key = imageId + ".jpg"; //must use key as img id.
    // can get from location in db
    //or just make db save mimetype
    //id does not have extension.

    //delete from s3
    let deleted_s3;
    try {
      deleted_s3 = await deleteImage(key);
    } catch (err) {
      res.jsend.fail({
        result: { deleted_s3: deleted_s3 },
        message: `unable to delete image with id: ${imageId} and key: ${key}`,
        error: err.message,
      });
    }

    //delete from db
    let deleted_db;
    try {
      deleted_db = await imageService.delete(imageId, userId);
    } catch (err) {
      res.jsend.fail({
        result: { deleted_db: deleted_db },
        message: `unable to delete image with id: ${imageId} and key: ${key}`,
        error: err.message,
      });
    }

    res.jsend.success({
      result: { deleted_db: deleted_db, deleted_s3: deleted_s3 },
      message: "image deleted",
    });
  }
);

module.exports = router;
