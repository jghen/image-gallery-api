const {
  validateString,
  isString,
  notFoundError,
  notValidError,
  notProvidedError,
  alreadyExistsError,
} = require("../utils/hoc");

module.exports = {
  validateUserId: async function (req, res, next) {
    const { userId } = req;

    if (userId == null) {
      return notProvidedError("userId", res);
    }

    if (isNaN(userId)) {
      return notValidError("userId", res);
    }

    next();
  },

  validateImageId: (uuidValidate) =>
    async function (req, res, next) {
      const { imageId } = req.params;

      if (!uuidValidate(imageId)) {
        return notValidError("imageId", res);
      }

      if (imageId == null) {
        return notProvidedError("imageId", res);
      }

      next();
    },

    validateKey: (uuidValidate) =>
    async function (req, res, next) {
      const { key } = req.params;
      const splittedKey = key.split('.');
      const imageId = splittedKey[0];
      const fileExtension = splittedKey.slice(-1).join('');
      const allowedExt = ["jpg", "jpeg", "png", "gif"];

      if(!allowedExt.includes(fileExtension)) {
        return notValidError("key", res);
      }

      if (!uuidValidate(imageId)) {
        return notValidError("key (uuid)", res);
      }

      if (key == null) {
        return notProvidedError("key", res);
      }

      next();
    },

  validateFileInfo: async function (req, res, next) {
    const { title, subtitle, text } = req.body;
    const fileInfo = [title, subtitle, text];
    const fileInfoValid = fileInfo.every((str) => isString(str));

    if (!fileInfoValid) {
      return notValidError("title/subtitle/desctiprion", res);
    }
    if(!title) {
      return notProvidedError('title is required. Title', res)
    }

    next();
  },

  validateImage: async function (req, res, next) {
    const { fileExtensionError, mimetypeError } = req;

    if (mimetypeError) {
      return notProvidedError(mimetypeError + ". Mimetype image", res);
    }

    if (fileExtensionError) {
      return notValidError(fileExtensionError, res);
    }
    next();
  },

  validateName: async function (req, res, next) {
    const { name } = req.body;
    const isValid = validateString(name);

    if (!isValid) {
      return notValidError("name", res);
    }
    next();
  },

  validateEmail: async function (req, res, next) {
    const { email } = req.body;
    const isValid =
      /^\S+@\S+\.\S+$/.test(email) && email != null && typeof email == "string";

    if (!isValid) {
      return notValidError("email", res);
    }
    next();
  },

  validatePassword: async function (req, res, next) {
    const { password } = req.body;
    const isValid =
      password.length > 3 && password != null && typeof password == "string";

    if (!isValid) {
      return notValidError("password", res);
    }
    next();
  },
};
