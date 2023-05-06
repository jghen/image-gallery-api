var aws = require('aws-sdk');
var express = require('express');
var multer = require('multer');
var sharp = require('sharp');

var app = express();
var s3 = new aws.S3({ /* ... */ });

var upload = multer({
  limits: { fileSize: 10 * 1000 * 1000 }, // now allowing user uploads up to 10MB
  fileFilter: function(req, file, callback) {
    let fileExtension = (file.originalname.split('.')[file.originalname.split('.').length-1]).toLowerCase(); // convert extension to lower case
    if (["png", "jpg", "jpeg"].indexOf(fileExtension) === -1) {
      return callback('Wrong file type', false);
    }
    file.extension = fileExtension.replace(/jpeg/i, 'jpg'); // all jpeg images to end .jpg
    callback(null, true);
  },
  storage: multer.diskStorage({
    destination: '/tmp', // store in local filesystem
    filename: function (req, file, cb) {
      cb(null, `${req.user._id.toHexString()}-${Date.now().toString()}.${file.extension}`) // user id + date
    }
  })
});

app.post('/upload', upload.single('file'), function(req, res, next) {
  const image = sharp(req.file.path); // path to the stored image
  image.metadata() // get image metadata for size
  .then(function(metadata) {
    if (metadata.width > 1800) {
      return image.resize({ width: 1800 }).toBuffer(); // resize if too big
    } else {
      return image.toBuffer();
    }
  })
  .then(function(data) { // upload to s3 storage
    fs.rmSync(req.file.path, { force: true }); // delete the tmp file as now have buffer
    let upload = {
      Key: 'some-key',
      Body: data,
      Bucket: 'some-bucket',
      ACL: 'public-read',
      ContentType: req.file.mimetype, // the image type
    };
    s3.upload(upload, function(err, response) {
      if (err) {
        return res.status(422).send("There was an error uploading an image to s3: " + err.message);
      } else {
        res.send(response.Location); // send the url to the stored file
      }
    });
  })
  .catch(function(err) {
    return res.status(422).send("There was an error processing an image: " + err.message);
  });
});