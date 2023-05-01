const {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// const { waitFor } = require("@aws-sdk/util-waiter");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { getFileExtension } = require("../utils/hoc");
// const { retryMiddleware } = require("@aws-sdk/middleware-retry");
const { crypto } = require("crypto");

// const retryOptions = {
//   maxAttempts: 10, // maximum number of retry attempts
//   retryDelayOptions: {
//     base: 1000, // base retry delay in milliseconds
//     customBackoff: (retryCount) => retryCount * 1000, // custom retry delay function
//   },
// };

const getClient = () => {
  return new S3Client({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_BUCKET_REGION,
    // middleware: [retryMiddleware(retryOptions)],
    // signatureVersion: "v4",
  });
};

const bucket = process.env.AWS_BUCKET_NAME;

const multerFilter = (req, file, cb) => {
  let fileError;

  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    fileError = `mimetype must be image. file: ${fileExt}`;
    req.mimetypeError = fileError;
    cb(null, false, new Error(fileError)); //reject file
  }
  const allowedExt = [".jpg", ".jpeg", ".png", ".gif"];
  const fileExt = getFileExtension(file.originalname);
  if (allowedExt.includes(fileExt)) {
    cb(null, true);
  } else {
    fileError = `file extension: ${fileExt}. allowed: ${allowedExt.join(
      " "
    )}. `;
    req.fileExtensionError = fileError;
    cb(null, false, new Error(fileError)); //reject file
  }
};

const s3storage = multerS3({
  s3: getClient(),
  bucket: bucket,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  cacheControl: "max-age=31536000",
  metadata: function (req, file, cb) {
    cb(null, Object.assign({}, file.originalname));
  },
  key: function (req, file, cb) {
    // const ext = getFileExtension(file.originalname);
    cb(null, req.params.imageId);
  },
});

//upload
const uploadImage = multer({
  storage: s3storage,
  limits: {
    fileSize: 1024 * 1024 * 10, //  allowing only 5 MB files
  },
  fileFilter: multerFilter,
});

//get one
async function getOneImage(key) {
  var params = { Bucket: bucket, Key: key };
  const command = new GetObjectCommand(params);
  // return await getClient().send(command);
  return await getSignedUrl(getClient(), command, { expiresIn: 36000 });
}

//get all
async function getAllImages() {
  //get all
  let images;
  try {
    var params = { Bucket: bucket };
    const command = new ListObjectsV2Command(params);
    images = await getClient().send(command);
  } catch (error) {
    return error.message;
  }

  if (images?.KeyCount === 0) return [];

  //loop and sign all
  let signedUrls;
  try {
    signedUrls = await Promise.all(
      images?.Contents.map(async (image) => {
        const newParams = { Bucket: bucket, Key: image.Key };
        const newCommand = new GetObjectCommand(newParams);
        const signedUrl = await getSignedUrl(getClient(), newCommand, {
          expiresIn: 36000,
        });
        return signedUrl;
      })
    );
  } catch (error) {
    return error.message;
  }

  return signedUrls;
}

//delete

async function deleteImage(key) {
  console.log("deleting s3");
  // const params = { Bucket: bucket, Key: key };
  console.log(key, typeof key);

  //check if exists
  let images;
  try {
    var params = { Bucket: bucket };
    const command = new ListObjectsV2Command(params);
    images = await getClient().send(command);
  } catch (error) {
    return error.message;
  }
  const exists = images?.Contents?.filter((image) => image.Key == key);
  if (exists) console.log("key exists!");

  //delete object:
  const input = {
    Bucket: bucket,
    Delete: {
      Objects: [
        {
          Key: key,
        },
      ],
      Quiet: false,
    },
  };

  const command = new DeleteObjectsCommand(input);

  try {
    return await getClient().send(command);
  } catch (err) {
    console.log(err);
    return err.message;
  }
}

module.exports = { uploadImage, deleteImage, getOneImage, getAllImages };
