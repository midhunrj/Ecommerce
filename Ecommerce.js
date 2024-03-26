const express = require('express');
const app = express();
var bodyParser = require('body-parser')
const port = 5000;
const mongoose=require("mongoose")
require('dotenv').config();
mongoose.connect(process.env.atlas||"mongodb://localhost:27017/E-Commerce")
const sharp=require("sharp")
const nocache = require("nocache");
const flash=require("connect-flash")

// ...

app.use(nocache()) 

app.use(flash())
// Middleware to parse JSON requests
app.use(express.json())
app.use(express.urlencoded({ extended: true }));  


// Sample route
app.use(express.static('public'));
const userRoute = require('./routers/user-router');
app.use('/', userRoute);

//admin route
const adminRoute=require('./routers/admin-router');
app.use('/',adminRoute);
 
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

    