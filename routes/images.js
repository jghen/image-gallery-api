var express = require("express");
var router = express.Router();
const jsend = require("jsend");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const { v4: uuidv4 } = require("uuid");

//Db and services:
const db = require("../models");
const UserService = require("../services/UserService");
const ImageService = require("../services/ImageService");
const userService = new UserService(db);
const imageService = new ImageService(db);

//middleware:
const { upload } = require("../services/uploadService");
const { authorize } = require("./authMiddleware");
const { validateUserId, validateFileInfo, validateImageId } = require("./validationMiddleware");

router.use(jsend.middleware);

/* GET rooms listing. */
router.get("/:imageId", authorize, validateUserId, validateImageId, async function (req, res, next) {
  res.jsend.success({ result: {}, message: "this is images/:id" });
});

router.get("/", async function (req, res, next) {
  res.jsend.success({ result: {}, message: "this is /images" });
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
  validateImageId,
  validateFileInfo,
  upload.single("image"),
  async (req, res, next) => {

    const { file, userId } = req;
    const { imageId } = req.params; // add id as uuid to front-end
    const { title, subtitle, text } = req.body;
    console.log("--req.file:", file);

    let s3_image;
    let db_image;
    try {
      s3_image = await uploadService.upload(file);
      db_image = await imageService.create( imageId, userId, file.filename, title, subtitle, text );
      console.log("--s3-response:", s3_image);
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
        s3_image: s3_image,
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
  validateImageId,
  async function (req, res, next) {

    const { userId } = req;
    const { imageId } = req.params;

    let deleted;
    try {
      deleted = await imageService.delete(imageId, userId);
    } catch (err) {
      res.jsend.fail({
        result: { deleted: deleted },
        message: `unable to delete image width id: ${imageId}`,
        error: err.message,
      });
    }

    res.jsend.success({
      result: { deleted: deleted },
      message: "image deleted",
    });
  }
);

module.exports = router;
