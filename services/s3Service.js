const { ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

const s3Client = new S3Client({
  credentials: {accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,},
  region: process.env.AWS_BUCKET_REGION
});

const bucket = process.env.AWS_BUCKET_NAME;

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload images only.'), false);
  }
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = file.originalname.split('.').slice(-1);
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files with extensions .jpg, .jpeg, .png, and .gif are allowed.'), false);
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
    const ext = file.originalname.split('.').slice(-1);
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
async function getOneImage (key) {
  var params = { Bucket: bucket, Key: key, };
  const command = new GetObjectCommand(params);
  return await s3Client.send(command);
};

//get all
async function getAllImages () {
  var params = { Bucket: bucket};
  const command = new ListObjectsV2Command(params);
  return await s3Client.send(command);
};

//delete
async function deleteImage (key) {
  var params = { Bucket: bucket, Key: key, };
  const command = new DeleteObjectCommand(params);
  return await s3Client.send(command);
};

module.exports =  {uploadImage, deleteImage, getOneImage, getAllImages} ;
