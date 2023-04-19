const express = require("express");
const jsend = require("jsend");
const router = express.Router();
const db = require("../models");
const crypto = require("crypto");
const UserService = require("../services/UserService");
const userService = new UserService(db);
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const jwt = require("jsonwebtoken");
const {
  validateEmail,
  validateName,
  validatePassword
} = require("./validationMiddleware");
const { invalidCredentialsError } = require("../utils/hoc");

router.use(jsend.middleware);

//create user - Sign up
router.post( "/signup", jsonParser, validateEmail, validateName, validatePassword, async (req, res, next) => {
  const { name, email, password } = req.body;
  console.log(name, email, password);

  var salt = crypto.randomBytes(16);

  crypto.pbkdf2( password, salt, 310000, 32, "sha256", async function (err, hashedPassword) {
    if (err) {
      return next(err);
    }
    await userService.create(name, email, hashedPassword, salt);
    res.status(200).jsend.success({ result: "You created an account." });
  });
    
});

// log in user
router.post( "/login", jsonParser, validateEmail, validatePassword, async (req, res, next) => {
  const { email, password } = req.body;

  await userService.getOneByEmail(email).then((data) => {
    if (data === null) {
      return invalidCredentialsError(res);
    }

    crypto.pbkdf2( password, data.salt, 310000, 32, "sha256", function (err, hashedPassword) {
      if (err) {
        return cb(err);
      }

      //wrong email or password
      if (!crypto.timingSafeEqual(data.encryptedPassword, hashedPassword)) {
        return invalidCredentialsError(res);
      }

      //successful login
      let token;
      try {
        token = jwt.sign(
          { id: data.id, email: data.email },
          process.env.TOKEN_SECRET,
          { expiresIn: "2h" }
        );
      } catch (err) {
        res
          .status(500)
          .jsend.error("Something went wrong with creating JWT token");
      }

      return res.status(200).jsend.success({
        result: "You are logged in",
        id: data.id,
        email: data.email,
        token: token,
      });
    });
  });
});

module.exports = router;
