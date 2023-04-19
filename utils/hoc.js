module.exports = {
  validateString: function (str) {
    return /^[a-zA-Z ]+$/.test(str) && str != null && typeof str == "string";
  },

  validateStringWithNumbers: function (str) {
    return /^[a-zA-Z0-9 ]+$/.test(str) && str != null && typeof str == "string";
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

  notProvidedError: function (typeOfData, res) {
    return res.status(400).jsend.fail({
      result: {},
      message: `${typeOfData} not provided`,
    });
  },

  alreadyExistsError: function (typeOfData, data, res) {
    return res.status(400).jsend.fail({
      message: `${typeOfData} already exists`,
      current: data,
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
};
