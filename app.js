const express = require('express')
const nocache = require('nocache')
const session = require('express-session')
const User = require('./model/user_model')
const adminRouter = require('./routes/adminRouter')
const userRouter = require('./routes/userRouter')
require('dotenv').config()
const app = express()
const PORT = 3000;

//connecting database
const mongoose = require("mongoose");
const connect = mongoose.connect(process.env.MONGODB)
connect
.then(()=>{
    console.log("MongoDB is connected successfully");
})
.catch((error)=>{
    console.log("Error connecting to MongoDB",error);
})

//setting ejs
app.set('view engine','ejs')

//url encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//using nocache for session manegment
app.use(nocache());

//using session
app.use(
    session({
      secret: "secret key",
      resave: false,
      saveUninitialized: true,
    })
  ); 
//
app.use('/',adminRouter);
app.use('/',userRouter); 

//static
app.use("/static", express.static("public"));
app.use("/assets", express.static("public/assets"));
app.use("/asset", express.static("public/asset"));
app.use(express.static('uploads'))





app.listen(PORT,()=>{
    console.log(`server on http://localhost:${PORT}`);
})