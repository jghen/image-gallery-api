var express = require("express");
var router = express.Router();
const jsend = require("jsend");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const { v4: uuidv4 } = require("uuid");

//Db and services:
const db = require("../models");
const ImageService = require("../services/ImageService");
const imageService = new ImageService(db);

//middleware:
const { uploadImage, deleteImage, getAllImages, getOneImage, } = require("../services/s3Service");
const { validateUserId, validateFileInfo, validateImageId, } = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const { notFoundError, notProvidedError } = require("../utils/hoc");

const bucket = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;

router.use(jsend.middleware);

const getEncodedUrl = (obj) => {
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(obj.Key)}`
}

//get one
router.get(
  "/:key",
  authorize,
  validateUserId,
  validateImageId(uuidv4),
  async function (req, res, next) {

    const { key } = req.params;
    
    let image;
    try {
      image = await s3Service.getOneImage(key);
      console.log('--image:',image);
    } catch (err) {
      notFoundError('image', res);
      console.log(err.message);
    }
    res.jsend.success({ result: {url:getEncodedUrl(image)}, message: "this is images/:key" });
  }
);

//get all
router.get("/", async function (req, res, next) {
  let images;
  try {
    images = await s3Service.getAllImages();
    console.log("--images response:", images);
  } catch (err) {
    notFoundError("images", res);
    console.error(err.message);
  }

  // Extract the URLs and send to frontend
  const result = images.Contents.map((obj) => {
    return {
      url: getEncodedUrl(obj),
      key: obj.key,
    };
  });
  console.log('result:', result);

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
  jsonParser,
  authorize,
  validateUserId,
  validateImageId(uuidv4),
  validateFileInfo,
  uploadImage.single("image"),
  async (req, res, next) => {
    
    const { file } = req;
    const { imageId } = req.params; // add id as uuid to front-end.
    const { title, subtitle, text } = req.body;
    console.log("--req.file:", file);

    if(file==null) notProvidedError('file', res);

    let db_image;
    try {
      db_image = await imageService.create( imageId, location, file.filename, title, subtitle, text );
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
        s3_image: file.filename,
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
  validateImageId(uuidv4),
  async function (req, res, next) {
    const { userId } = req;
    const { imageId } = req.params;
    const key = imageId + ".jpg";

    //delete from s3
    let deleted_s3;
    try {
      deleted_s3 = await s3Service.deleteImage(key);
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
