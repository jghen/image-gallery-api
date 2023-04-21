const jwt = require("jsonwebtoken");

module.exports = {
  authorize: function (req, res, next) {
    const token = req.cookies.access_token;
    // const token = req.signedCookies.access_token; //if signed: true.

    console.log('token', token)
    if (!token) {
      res.clearCookie("access_token");
      return next()
    }

    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      //clear permissions
      res.clearCookie("access_token");
      return next();
    }
  },
};
