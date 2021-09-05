//requiring all the required packages
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000;
const saltRounds = 10;

//creating our app
const app = express();

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));

//connetion with database userDB
mongoose.connect("mongodb://localhost:27017/userDB",{
    useNewUrlParser: true
});

//User Schema for email and password
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//creating model
const User = new mongoose.model("User",userSchema);

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

//post method for register route
app.post("/register",function(req,res){
    bcrypt.hash(req.body.password,saltRounds,function(err,hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err){
            if(err){
                console.log(err);
            }else{
                res.render('secrets');
            }
        });
    }) 
});
//post method for login route
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                bcrypt.compare(password,foundUser.password,function(err,result) {
                    if(result === true){
                        res.render('secrets');
                    }else{
                        console.log("Incorrect Password!");
                    }    
                });
            }else{
                console.log("Invalid email");
            }
        }
    });
});

//listening to port
app.listen(port,function(){
    console.log("Server started on port "+port);
});