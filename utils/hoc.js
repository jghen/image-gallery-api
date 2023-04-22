module.exports = {
  validateString: function (str) {
    return /^[a-zA-Z ]+$/.test(str) && str != null && typeof str == "string";
  },

  isString: function (str) {
    return str != null && typeof str == "string";
  },

  notFoundError: function (typeOfData, res) {
    return res.status(404).jsend.fail({
      result: {},
      message: `${typeOfData} does not exist`,
    });
  },

  notValidError: function (typeOfData, res) {
    return res.status(400).jsend.fail({
      result: {},
      message: `invalid ${typeOfData}`,
    });
  },

  unauthorizedError: function (errorMessage, res) {
    return res.status(401).jsend.fail({
      result: {},
      message: `Unauthorized: ${errorMessage}`,
    });
  },

  notProvidedError: function (typeOfData, res) {
    return res.status(400).jsend.fail({
      result: {},
      message: `${typeOfData} not provided`,
    });
  },

  alreadyExistsError: function (typeOfData, data, res) {
    return res.status(400).jsend.fail({
      result: {current: data},
      message: `${typeOfData} already exists`,
    });
  },

  notExistsError: function (typeOfData, res) {
    return res.status(400).jsend.fail({
      result: {},
      message: `${typeOfData} does not exist`,
    });
  },

  invalidCredentialsError: function (res) {
    return res.status(401).jsend.fail({
      result: {},
      message: "Incorrect email or password",
    });
  },
  getFileExtension: function (originalname) {
    if (!originalname) return false;
    return `.${originalname.split('.').slice(-1)}`;
  }
};
