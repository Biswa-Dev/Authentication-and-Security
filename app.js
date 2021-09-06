//requiring all the required packages
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const e = require('express');
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
    password: String
});

//adding passport-local-mongoose as plugin to userSchema
userSchema.plugin(passportLocalMongoose);

//creating model
const User = new mongoose.model("User",userSchema);

//using the plugin to create strategy to authenticate user
passport.use(User.createStrategy());
//to create and crumble cookies using serialize and deserialize
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
//get method for secrets route
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render('secrets');
    }else{
        res.redirect('/login');
    }    
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