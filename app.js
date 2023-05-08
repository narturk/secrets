const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');

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

const userSchema = {
  email: String,
  password: String
};

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
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  try {
    newUser.save();
    res.render("secrets");
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;
  let foundUser;
  try{
    foundUser = await User.findOne({email: username, password: password});
    if(foundUser){
      res.render("secrets");
    }else{
      console.log("User didn`t found!");
    }
  }catch(err){
    console.log(err);
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
