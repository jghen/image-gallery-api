const {
  validateString,
  validateStringWithNumbers,
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

  validateImageId: (uuid)=>async function (req, res, next) {
    const { imageId } = req.params;

    if (!uuid.validate(id)) {
      return notValidError("imageId", res);
    }

    if (imageId == null) {
      return notProvidedError("imageId", res);
    }

    next();
  },

  validateFileInfo: async function (req, res, next) {
    const { title, subtitle, text } = req.body;
    const fileInfo = [title, subtitle, text];
    const fileInfoValid = fileInfo.every((str) => validateStringWithNumbers(str));

    if (!fileInfoValid) {
      return notValidError(fileInfo.join(" / "), res);
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
