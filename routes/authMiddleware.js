const jwt = require("jsonwebtoken");

module.exports = {
  authorize: function (req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .jsend.fail({ result: {}, message: "JWT token not provided" });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.userId = decodedToken.id;
      req.email = decodedToken.email;
      return next();
    } catch (err) {
      return res
        .status(401)
        .jsend.fail({ result: {}, message: "Unvalid jwt token provided" });
    }
  },
};
