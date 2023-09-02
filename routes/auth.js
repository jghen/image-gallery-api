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
const {
  validateEmail,
  validateName,
  validatePassword,
} = require("./validationMiddleware");
const { authorize } = require("./authMiddleware");
const { invalidCredentialsError } = require("../utils/hoc");

router.use(jsend.middleware);

//log out - clear cookie
router.post("/logout", authorize, async (req, res, next) => {
  //clear refresh token from db:
  await userService.setRefreshToken(null);
  //clear from cookie
  return res.clearCookie("refresh_token").redirect("/");
});

//create user - Sign up
//NB! authorize middleware is on - so no one can sign up!

router.post(
  "/signup",
  authorize,
  jsonParser,
  validateEmail,
  validateName,
  validatePassword,
  async (req, res, next) => {
    const { name, email, password } = req.body;

    var salt = crypto.randomBytes(16);

    crypto.pbkdf2(
      password,
      salt,
      310000,
      32,
      "sha256",
      async function (err, hashedPassword) {
        if (err) {
          return next(err);
        }
        await userService.create(name, email, hashedPassword, salt, null);
        res.status(200).jsend.success({ result: "You created an account." });
      }
    );
  }
);

// log in user
router.post(
  "/login",
  jsonParser,
  validateEmail,
  validatePassword,
  async (req, res, next) => {
    const { email, password } = req.body;

    await userService.getOneByEmail(email).then((data) => {
      if (data === null) {
        return invalidCredentialsError(res);
      }

      return new Promise((resolve, reject) => {
        crypto.pbkdf2( password, data.salt, 310000, 32, "sha256", async function (err, hashedPassword) {
          if (err) reject(err);

          //wrong email or password
          if (
            !crypto.timingSafeEqual(data.encryptedPassword, hashedPassword)
          ) {
            return invalidCredentialsError(res);
          }

          //successful login
          let accessToken;
          try {
            accessToken = jwt.sign(
              { id: data.id, email: data.email },
              process.env.ACCESS_TOKEN_SECRET,
              { expiresIn: "1h" }
            );
          } catch (err) {
            res
              .status(500)
              .jsend.error(
                "Something went wrong with creating JWT accessToken:" +
                  err.message
              );
          }

          let refreshToken;
          try {
            refreshToken = jwt.sign(
              { id: data.id, email: data.email },
              process.env.REFRESH_TOKEN_SECRET,
              { expiresIn: "1d" }
            );
          } catch (err) {
            res
              .status(500)
              .jsend.error(
                "Something went wrong with creating JWT refreshToken:" +
                  err.message
              );
          }

          //save refreshToken in db
          let db_refreshToken = null;
          try {
            db_refreshToken = await userService.setRefreshToken(refreshToken);
          } catch (err) {
            return res.jsend.fail({
              result: {},
              message: `Error saving refreshToken in db`,
              error: err.message,
            });
          }

          if (!db_refreshToken) {
            return uploadError("refreshToken to db.", res);
          }

          return res
            .cookie("refresh_token", refreshToken, {
              httpOnly: true,
              maxAge: 3 * 60 * 60 * 1000, //3h
              secure: true, // if production
              //signed: true, // if signed
              sameSite: "none",
            })
            .status(200)
            .jsend.success({
              result: {
                id: data.id,
                email: data.email,
                token: accessToken,
              },
              message: "You are logged in",
            });
          }

        );
      });
    });
  }
);

module.exports = router;
