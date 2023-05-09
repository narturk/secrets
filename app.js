require('dotenv').config();

const findOrCreate = require('mongoose-findorcreate')
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const env = require("dotenv").config();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err))
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/userDB')
}

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
userSchema.plugin(findOrCreate);

//Changed to work with all forms of auth instead of just local
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(async function(id, done) {
  let userFound;
  let error;
  try {
    userFound = await User.findById(id);
  } catch (err) {
    console.log(err);
    error = err;
  }
  done(error, userFound);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  })
);

app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", async function(req, res) {
  let foundUsers;
  try {
    foundUsers = await User.find({
      "secret": {
        $ne: null
      }
    });
    if (foundUsers) {
      res.render("secrets", {
        usersWithSecrets: foundUsers
      })
    } else {
      console.log("Did not find secrets.");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.render("login");
  }
});

app.post("/submit", async function(req, res) {
  const submittedSecret = req.body.secret;
  let foundUser;
  try {
    foundUser = await User.findById(req.user.id);
    if (foundUser) {
      foundUser.secret = submittedSecret;
      try {
        foundUser.save();
        res.redirect("/secrets");
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log("user did not found!");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    } else {
      res.redirect("/");
    }
  });
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      });
    }
  });
});

app.post("/login", async function(req, res) {
  const user = new User({
    username: req.body.username,
    passport: req.body.passowrd
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      });
    }
  });
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
