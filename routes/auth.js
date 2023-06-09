require("dotenv").config();
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
const { validateEmail, validateName, validatePassword } = require("./validationMiddleware");
const {authorize} = require('./authMiddleware');
const { invalidCredentialsError } = require("../utils/hoc");

router.use(jsend.middleware);

//log out - clear cookie
router.post("/logout", authorize, async (req, res, next) => {
  return res.clearCookie("access_token").redirect("/");
});

//create user - Sign up
//NB! authorize middleware is on - so no one can sign up!

router.post( "/signup", authorize, jsonParser, validateEmail, validateName, validatePassword, async (req, res, next) => {
  const { name, email, password } = req.body;

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
          { expiresIn: "3h" }
        );
      } catch (err) {
        res
          .status(500)
          .jsend.error("Something went wrong with creating JWT token:" + err.message);
      }

      
      return res
        .cookie("access_token", token, {
          httpOnly: true,
          maxAge: 3 * 60 * 60 * 1000, //3h
          secure: true, // if production
          //signed: true, // if signed
          sameSite: 'none',
        })
        .status(200).jsend.success({
          result: {
            id: data.id,
            email: data.email,
            token: token,
          },
          message: "You are logged in"
        });
    });
  });
});

module.exports = router;
