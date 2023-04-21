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

//middleware:
const { uploadImage, deleteImage, getAllImages, getOneImage, } = require("../services/s3Service");
const { validateUserId, validateFileInfo, validateImageId, validateImage, } = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const { notFoundError, notProvidedError } = require("../utils/hoc");

const bucket = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;

router.use(jsend.middleware);



//get one
router.get(
  "/:key",
  authorize,
  validateUserId,
  validateImageId(uuidValidate),
  async function (req, res, next) {
    const { key } = req.params;

    let image;
    try {
      image = await getOneImage(key);
      console.log("--image:", image);
    } catch (err) {
      notFoundError("image", res);
      console.log(err.message);
    }
    res.jsend.success({
      result: { url: encodeURI(image) },
      message: "this is images/:key",
    });
  }
);

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

  // Extract the URLs and send to frontend
  const encodedUrls =  await imageUrls?.map((obj) => encodeURI(obj));

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
    imageData: imageData
  }
  console.log(result)

  // remember to decode urls in the frontend:
  // const decodedUrl = decodeURIComponent(encodedUrl);

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

//delete image - must implement middleware
router.delete(
  "/:imageId",
  jsonParser,
  authorize,
  validateUserId,
  validateImageId(uuidValidate),
  async function (req, res, next) {
    const { userId } = req;
    const { imageId } = req.params;
    const key = imageId + ".jpg";

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
