const sharp = require("sharp");
const { encode } = require("blurhash");

const encodeImageToBlurhash = (path) =>
  new Promise((resolve, reject) => {
    sharp(path)
      .raw()
      .ensureAlpha()
      .resize(40, 40, { fit: "inside" })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      });
  });

const resizeImage = (path) =>
  new Promise((resolve, reject) => {
    sharp(path)
      .resize({ width: 800 }, null, { withoutEnlargenment: true, quality: 75 })
      .withMetadata()
      .toBuffer((err, buffer) => {
        if (err) return reject(err);
        resolve(buffer);
      });
  });

module.exports = { resizeImage, encodeImageToBlurhash };
