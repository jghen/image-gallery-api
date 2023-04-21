const {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { getFileExtension } = require("../utils/hoc");

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
});

const bucket = process.env.AWS_BUCKET_NAME;

const multerFilter = (req, file, cb) => {
  let fileError;
  console.log(file);
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
  s3: s3Client,
  bucket: bucket,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, Object.assign({}, req.body));
  },
  key: function (req, file, cb) {
    const ext = getFileExtension(file.originalname);
    cb(null, req.params.imageId + ext);
  },
});

//upload
const uploadImage = multer({
  storage: s3storage,
  limits: {
    fileSize: 1024 * 1024 * 5, //  allowing only 5 MB files
  },
  fileFilter: multerFilter,
});

//get one
async function getOneImage(key) {
  var params = { Bucket: bucket, Key: key };
  const command = new GetObjectCommand(params);
  // return await s3Client.send(command);
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

//get all
async function getAllImages() {

  //get all
  let images;
  try {
    var params = { Bucket: bucket };
    const command = new ListObjectsV2Command(params);
    images = await s3Client.send(command);
    console.log('--s3 images',images);
  } catch (error) {
    return error.message;
  }

  if(images?.KeyCount === 0) return [];

  //loop and sign all
  let signedUrls;
  try {
    signedUrls = await Promise.all(images?.Contents.map(async (image) => {
      const newParams = { Bucket: bucket, Key: image.Key };
      const newCommand = new GetObjectCommand(newParams);
      const signedUrl = await getSignedUrl(s3Client, newCommand, { expiresIn: 3600 });
      return signedUrl;
    }));
  } catch (error) {
    return error.message;
  }
  console.log(signedUrls)
  return signedUrls;
}

//delete
async function deleteImage(key) {
  var params = { Bucket: bucket, Key: key };
  const command = new DeleteObjectCommand(params);
  return await s3Client.send(command);
}

module.exports = { uploadImage, deleteImage, getOneImage, getAllImages };
