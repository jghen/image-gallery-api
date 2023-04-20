require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const imagesRouter = require("./routes/images");

const db = require("./models");
db.sequelize.sync({ force: true });

const app = express();

const port = process.env.PORT || "3000";
app.set("port", port);
const server = http.createServer(app);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "http://localhost:5173" }));
app.use(cookieParser());

//routes
app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/images", imagesRouter);

// all other requests:
app.get("*", function (req, res) {
  res.status(404).redirect("/");
});

server.listen(port, () => {
  console.log("Server listening on port " + port);
});

module.exports = app;
