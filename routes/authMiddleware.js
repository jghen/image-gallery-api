const jwt = require("jsonwebtoken");
const { notProvidedError, unauthorizedError } = require("../utils/hoc");

module.exports = {
  authorize: function (req, res, next) {
    const token = req.cookies.access_token;
    // const token = req.signedCookies.access_token; //if signed: true.

    if (!token) {
      res.clearCookie("access_token");
      return unauthorizedError('jwt token not provided', res);
    }

    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      //clear permissions
      res.clearCookie("access_token");
      return unauthorizedError('jwt token invalid', res);
    }
  },
};
