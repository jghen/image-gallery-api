const jwt = require("jsonwebtoken");
const { notProvidedError, unauthorizedError } = require("../utils/hoc");

module.exports = {
  authorize: function (req, res, next) {
    const token = req.headers.authorization.split('Bearer ')[1];

    if (!token) {

      return unauthorizedError('jwt token not provided', res);
    }

    try {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      //clear permissions
      res.clearCookie("refresh_token");
      return unauthorizedError('jwt token invalid', res);
    }
  },

  authorizeRefreshToken: function (req, res, next) {
    const token = req.cookies.refresh_token;
    // const token = req.signedCookies.refresh_token; //if signed: true.

    if (!token) {
      res.clearCookie("refresh_token");
      return unauthorizedError('jwt token not provided', res);
    }

    try {
      const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      //clear permissions
      res.clearCookie("refresh_token");
      return unauthorizedError('jwt token invalid', res);
    }
  },
};
