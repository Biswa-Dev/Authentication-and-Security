//requiring all the required packages
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const port = process.env.PORT || 3000;


//creating our app
const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));

//use session package
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized:false
}));

//initializing passport
app.use(passport.initialize());
//using session with passport
app.use(passport.session());

//connetion with database userDB
mongoose.connect("mongodb://localhost:27017/userDB",{
    useNewUrlParser: true
});

//User Schema for email and password
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

//adding passport-local-mongoose as plugin to userSchema
userSchema.plugin(passportLocalMongoose);
//adding findorcreate as a plugin to userSchema
userSchema.plugin(findOrCreate);

//creating model
const User = new mongoose.model("User",userSchema);

//using the plugin to create strategy to authenticate user
passport.use(User.createStrategy());
//to create and crumble cookies using serialize and deserialize
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
User.findById(id, function(err, user) {
    done(err, user);
});
});

//setting up our GoogleStrategy for authentication with google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    //remember before using findOrCreate just install mongoose-findorcreate and use it
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//setting up our FacebookStrategy for authentication with facebook
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//get method for home route
app.get("/",function(req,res){
    res.render('home');
});
//get method for register route
app.get("/register",function(req,res){
    res.render('register');
});
//get method for login route
app.get("/login",function(req,res){
    res.render('login');
});
//get method when user wants to login or register with google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);
//authenticate request
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});
//get method when user wants to login or register with facebook
app.get('/auth/facebook',
  passport.authenticate('facebook')
);
//get method for Redirect URI Validator
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});
//get method for secrets route
app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err){
            console.log(err);
        }else{
            if(foundUsers){
                res.render("secrets",{userWithSecrets: foundUsers});
            }
        }
    });    
});
app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render('submit');
    }else{
        res.redirect('/login');
    }
});
app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    //console.log(req.user);
    User.findById(req.user.id,function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});
//get method for logout
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

//post method for register route
app.post("/register",function(req,res){
    User.register({username: req.body.username},req.body.password,function(err,user){
       if(err){
           console.log(err);
           res.redirect("/register");
       }else{
           passport.authenticate("local")(req,res,function(){
               res.redirect("/secrets");
           });
        } 
    });
});
//post method for login route
app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

//listening to port
app.listen(port,function(){
    console.log("Server started on port "+port);
});