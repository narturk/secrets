require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

//connect to mongoDB
main().catch(err => console.log(err))
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB')
}

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ['password']
// });

const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.post("/register", function(req, res) {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    try {
      newUser.save();
      res.render("secrets");
    } catch (err) {
      console.log(err);
    }
  });
});

app.post("/login", async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  let foundUser;
  try {
    foundUser = await User.findOne({
      email: username
    });
    if (foundUser) {
      bcrypt.compare(password, foundUser.password, function(err, result) {
        if (result == true){
            res.render("secrets");
        }else{
          console.log("Password is wrong!");
        }
      });
    } else {
      console.log("User didn`t found!");
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
