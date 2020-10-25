//const router = require("express").Router();
const express = require("express");
const path = require("path");
const fs = require("fs");

var app = express();

module.exports = app;

app.use(express.static("public"));

router.get("/loginPage", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/loginPage.html"));
});

// File path
let filePath = path.join(
  __dirname,
  "public",
  req.url === "/" ? "index.html" : req.url
);

// File ext
let extname = path.extname(filePath);

// Read file
fs.readFile(filePath, (err, content) => {
  if (err) {
    res.writeHead(500);
    res.end(`Server Error: ${err.code}`);
  } else {
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content, "utf-8");
  }
});
