const express = require('express');
const app = express();
var bodyParser = require('body-parser')
const port = 5000;
const mongoose=require("mongoose")
require('dotenv').config();
mongoose.connect(process.env.atlas).then(()=>{
  console.log('Connected');
}).catch((error)=>{
  console.log(error,'EROOOR');
})
const sharp=require("sharp") 
const nocache = require("nocache");
const flash=require("connect-flash")
app.set('view engine', 'ejs');
app.set('views', './views');

// ...

app.use(nocache()) 

app.use(flash())
// Middleware to parse JSON requests
app.use(express.json())
app.use(express.urlencoded({ extended: true }));  
const errorcontroller=require('./controllers/user-controller')

// Sample route
app.use(express.static('public'));
const userRoute = require('./routers/user-router');
app.use('/', userRoute);

//admin route
const adminRoute=require('./routers/admin-router');
app.use('/admin',adminRoute);
// app.use('*',errorcontroller.errorpage)
app.use("*", (req, res, next) => {
  
  res.status(404).render("404");
});

app.use((err,req,res,next)=>{
  console.log(err.stack)
  res.status(500).send("internal server error")
})
 
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

    