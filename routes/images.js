var express = require("express");
var router = express.Router();
const jsend = require("jsend");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const { unlink } = require("fs");

//Db and services:
const db = require("../models");
const ImageService = require("../services/ImageService");
const imageService = new ImageService(db);
const {
  upload,
  uploadImage,
  deleteImage,
  getAllImages,
  getOneImage,
} = require("../services/S3Service.js");
//middleware:
const {
  validateUserId,
  validateFileInfo,
  validateImageId,
  validateImage,
  validateKey,
} = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const {
  notFoundError,
  notProvidedError,
  deleteError,
  uploadError,
  notValidError,
  imageProcessingError,
} = require("../utils/hoc");
const {
  encodeImageToBlurhash,
  resizeImage,
} = require("../utils/imageProcessor");

router.use(jsend.middleware);

//get all
router.get("/", async function (req, res, next) {
  //get s3 signed image urls
  let imageUrls = [null];
  try {
    imageUrls = await getAllImages();
  } catch (err) {
    return notFoundError("Error:" + err.message + " Images", res);
  }

  if (!imageUrls) {
    return notFoundError("images", res);
  }

  // Encode Urls
  const encodedUrls = imageUrls?.map((obj) => encodeURI(obj));

  //get image data from db
  let imageData = [null];
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

  // res.setHeader("Cache-Control", "max-age=31536000"); //1 year cache

  return res.jsend.success({ result: result, message: "retrieved all images" });
});

//get one
router.get("/:imageId", validateImageId, async function (req, res, next) {
  const { imageId } = req.params;

  //get s3 signed image Url
  let imageUrl = null;
  try {
    imageUrl = await getOneImage(imageId);
  } catch (err) {
    console.log("--err:", err?.message);
    return notFoundError("Error:" + err.message + " Image", res);
  }

  if (!imageUrl) {
    return notFoundError("image", res);
  }

  // Encode Url
  const encodedUrl = encodeURI(imageUrl);

  //get image data from db
  let imageData = null;
  try {
    imageData = await imageService.getOneById(imageUrl);
  } catch (err) {
    console.log("--err:", err.message);
    return notFoundError("Error:" + err.message + " Image Data", res);
  }

  if (!imageData || !encodedUrl) {
    console.log('imageData or encodedUrl not found');
    return notFoundError("images", res);
  }

  const result = {
    encodedUrl: encodedUrl,
    imageData: imageData,
  };

  // res.setHeader("Cache-Control", "max-age=31536000"); //1 year cache
  return res.jsend.success({ result: result, message: "retrieved all images" });
});

//upload image
router.post(
  "/:imageId",
  authorize,
  upload.single("image"),
  validateUserId,
  validateImageId,
  validateFileInfo,
  validateImage,
  async (req, res, next) => {
    const { file } = req;
    const { title, subtitle, text } = req.body;
    const { imageId } = req.params;

    if (!file) return notProvidedError("file", res);
    if (!imageId) return notProvidedError("imageId", res);

    // encode to blurhash
    let imageBlurHash;
    try {
      imageBlurHash = await encodeImageToBlurhash(file.path);
    } catch (error) {
      imageProcessingError("Cannot make blurhash");
    }

    //resize
    let resized;
    try {
      resized = await resizeImage(file.path);
    } catch (error) {
      imageProcessingError("Cannot resize");
    }

    if (Buffer.isBuffer(resized) === false) {
      return notValidError("Buffer", res);
    }

    // upload to s3
    let s3_image = null;
    try {
      s3_image = await uploadImage(resized, imageId);
    } catch (error) {
      return res.jsend.fail({
        result: {},
        message: `Error uploading image to s3`,
        error: error.message,
      });
    }

    //delete tmp image
    unlink(file.path, function (err) {
      if (err) return console.log(err);
      console.log("file deleted successfully");
    });

    if (!s3_image) {
      return notValidError("file", res);
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
  validateKey,
  async function (req, res, next) {
    const { key } = req.params; //this is now the key

    //delete from db
    let deleted_db = null;
    try {
      deleted_db = await imageService.deleteOne(key);
    } catch (err) {
      return res.jsend.fail({
        result: { deleted_db: deleted_db },
        message: `unable to delete image with id: ${key}`,
        error: err.message,
      });
    }

    //if not deleted - error
    if (!deleted_db) {
      return deleteError("image from database", res);
    }

    //delete from s3
    let deleted_s3 = null;
    try {
      deleted_s3 = await deleteImage(key);
    } catch (err) {
      return res.jsend.fail({
        result: {},
        message: `unable to delete image with id: ${key}`,
        error: err.message,
      });
    }

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
