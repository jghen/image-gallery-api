const jwt = require("jsonwebtoken");

module.exports = {
  authorize: function (req, res, next) {
    const token = req.cookies.access_token;
    // const token = req.signedCookies.access_token; //if signed: true.

    if (!token) {
      res.clearCookie("access_token");
      return res.redirect("/login");
    }

    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      res.clearCookie("access_token");
      return res.redirect('/login');
    }
  },
};
