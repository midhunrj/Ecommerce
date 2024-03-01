const user = require('../models/usermodel');
const product=require('../models/productmodel');
const Category=require('../models/categorymodel')
const Cart=require('../models/Cartmodel')
const Coupon=require('../models/couponmodel')
const bcrypt = require('bcrypt');
const  nodemailer=require('nodemailer')
const randomString = require('randomstring')
const jwt = require('jsonwebtoken');

const currentDate=new Date()


// Function to generate a reset token
const generateResetToken = (email) => {
  const secretKey = 'your_secret_key';
  const expiresIn = '1h'; // Token will expire in 1 hour

  const token = jwt.sign({ email }, secretKey, { expiresIn });

  return token;
};


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

const securepassword = async (password) => {
    console.log("hhhhgg");
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error);
    }
}

const sendresetpasswordmail=async(username,email,_id,token)=>{
  console.log("user -",username,"email-",email,"\nid-",_id,"\n token-",token);
  const mailOptions = {
    from: 'mdnrj3600@gmail.com',
    to: email,
    subject: 'Email Verification',
    html: '<p>Hi '+username+', please click here to <a href="http://localhost:5000/forget-password-load?token='+token+'"Reset</a> your password</p>'
  };

  await transporter.sendMail(mailOptions);
}

console.log("midhun");

const Loginload = async (req, res) => {
    console.log("desw");
    try {
        console.log("kli");
        console.log("yhfggf");
        if(req.session.user)
        {
          res.redirect('/home')
        }
        // else if(req.session.admin)
        // {
        //   res.redirect('/admin_home')
        // }
        else 
        {
          // let message;
          // if(req.flash('Loginpage'))
          // {
          //    message=req.flash('Loginpage')
          // }
          // else{
          //   message=' '
          // }
          let message=req.session.message
        res.render('Loginpage',{title:"login page",message})}
        
    } catch (error) {
        console.log(error.message);
    }
}




const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    console.log(email);
    console.log(password);
    console.log("I am here");

    const userdata = await user.findOne({email });
    console.log(userdata);

    if (userdata) {
      const passwordmatch = await bcrypt.compare(password,userdata.password);
      console.log(passwordmatch,'passwordmatch\n',password,'password\n',userdata.password,"userdata.password");
     
     
      if (passwordmatch||password===userdata.password&&userdata.is_admin === 0 && userdata.is_blocked === 0) {
        console.log('User');
        req.session.user = userdata._id;
        res.redirect('/home');
      } else if (password===userdata.password&&userdata.is_admin === 0&&userdata.is_blocked===1) {
        console.log("Blocked");
        res.render('loginpage', { alert: "Your account is blocked" });
      // } else if (password===userdata.password&&userdata.is_admin === 1) {
      //   console.log('Admin');
      //   req.session.admin = userdata._id;
      //   res.redirect('/admin_home');
      // }
      } else if(password!==userdata.password||!passwordmatch) {
        console.log("Invalid password or user");
        res.render('loginpage', { alert: "Invalid password" });
      }else if (password===userdata.password&&userdata.is_admin === 1) {
        res.render('loginpage', { alert: "Invalid user" });
    }} 
    else {
      console.log("User not found");
      res.render('loginpage', { alert: "Invalid user details " });
    }
  } catch (error) {
    console.error(error.message);
    throw error; // Propagate the error to the caller (e.g., controller)
  }
};




// controllers/authController.js




      

const signuppage = async (req, res) => {
    try {
      
      req.session.referal=req.query.ref
        res.render("Signuppage",{title:"signup page"})
    } catch (error) {
        console.log(error.message);
    }
}

const Otppage = async (req, res) => {
    try {
        res.render("Otp",{title:"signup page"})
        
    } catch (error) {
        console.log(error.message);
    }
}
 
 
 

    
const insertUser = async (req, res) => {
    console.log(req.body)
    const {username,email,phone,password,confirmPassword}=req.body
    try {
        // Check if the phone number is already registered

        const hashpassword=await bcrypt.hash(password,10)
        const confirmPassword=hashpassword
        const existingUser = await user.findOne({ email });
        if (existingUser) {
          res.render('Signuppage',{message:'Email already registered' });
        }
        if(confirmPassword!==hashpassword)
        {
         res.render('signuppage',{message:'Two passwords are not same'})
        }
        const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
        // Generate OTP
        const otp = generateOTP();
         const otpexpire=currentDate.getTime()+20000
        console.log(otpexpire);
    
    const newuser=new user({
      username,
      email,
      phone,
      password,
      is_admin:0,
      otp
    })
    
  
     
      const mailOptions = {
        from: 'mdnrj3600@gmail.com',
        to: email,
        subject: 'Email Verification',
        text: `Your verification code is: ${otp}`,
      };
    
      let referal=req.session.referal
      await transporter.sendMail(mailOptions);
      req.session.tempdata={username,
        email,
        phone,
        hashpassword,
        is_admin:0,
      isVerified:false,
    otp,referal}
      res.render('Otp',{title:"signup page"})
    
    }
    catch(err)
    {
      console.error('Error saving user:',err)
    //    res.send('error saving user')
       
      }
    }
    

   

  
    
   


// Route for OTP verification
const VerifyOtp= async (req, res) => {
  
    try {
      const otpinput=currentDate.getTime()
  console.log(otpinput);
  console.log(req.body);
    const enteredOTP = req.body.otp;
    console.log("entered value is",enteredOTP);
      // Find user by phone number
      const {username,email,phone,hashpassword,is_admin,
        isVerified,otp,referal}=req.session.tempdata
        console.log(email);
        console.log(referal,"referal userid");
        const newuser = await user.findOne({email:email});
    
      // Nodemailer configuration
    
  
      // if (!newuser) {
      //   return res.status(404).json({ error: 'User not found' });
      // }
      const referwallet=await user.findOne({_id:referal})
   
      let Wallet=0
      if(referwallet)
      {
        Wallet=200
        referwallet.wallet=Wallet
        // await referwallet.save()
      }
      else{
        Wallet=0
      }

        const User=new user({
          username:username,
          email:email,
          phone:phone,
          password:hashpassword,
          is_admin:is_admin,
          isVerified:isVerified,
          otp:otp,
          wallet:Wallet
        })
      
        const otpexpire=currentDate.getTime()+20000
        console.log(otpexpire)
        console.log("user is",User.otp);
        console.log("Entered is",enteredOTP);
      // Verify entered OTP
      if (enteredOTP==User.otp) {
        
          User.isVerified =true;
      await User.save();
      console.log("heroooo");
      req.session.message='user saved successfuly'
      res.redirect('/')
      // res.render('Loginpage',{message:"user saved successfuly"})
   
    } 
      // else if(enteredOTP===User.otp&&otpinput>otpexpire)
      // {
      //     return res.json({message:"Your Otp is invalid it has expired"})
      // }
      else if(enteredOTP!=User.otp)
      {
        console.log("headache is");
        res.render('Otp',{message:"Invalid OTP"})
      }
      else {
        res.redirect('/otp')
        // return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
}
const Forgetload=async(req,res)=>{
  try{
    res.render('forgetpassword')
  }
  catch(error)
  {
    console.log(error.message);
  }
}
  
 const Forget=async(req,res)=>{
  try {
     const email=req.body.email;
     console.log("forg");
     const userData=await user.findOne({email:email})
     console.log("for");
     if(userData)
     {
      console.log("piare");
      if(userData.isVerified===false)
      {
        console.log("myself");
        res.render('forgetpassword',{message:"please verify your mail"})
      }
      else{
        console.log("miare");
        const randomstring=randomString.generate()
        const updatedData=await user.findOneAndUpdate({email:email},{$set:{token:randomstring}},{new:true})
        console.log(updatedData,"djdjjd");
        sendresetpasswordmail(userData.username,userData.email,userData._id,updatedData.token)
        res.render('forgetpassword',{message:"please check your mail to reset password"})
      }

     }
     else
     {
      res.render('forgetpassword',{message:"user email is incorrect"})
     }
    }
    catch(error)
{
console.log(error.message)
}
 } 

 const forgetpasswordload=async(req,res)=>{
  try{
    const token=req.query.token
    const tokendata=await user.findOne({token:token})
    console.log(tokendata);
    if(tokendata)
    {
      res.render('reset-password',{_id:tokendata._id})

    }
    else{
      res.render('404',{message:"token is invalid"})
    }
  }
  catch(error)
  {
  console.log(error.message)
  }
 }

const Homepage = async (req, res) => {
try{
const userData = await user.findById({ _id: req.session.user })

  req.session.user?true:false;
  

  const cartdata=await Cart.find({user_id:req.session.user}).countDocuments()
    // const categoryData=await category.find({is_active:false})
    const productData=await product.find({isVerified:true})
    const CategoryData=await Category.find({})
  res.render('userhome',{username:userData.username,products:productData,category:CategoryData,cartdata})
  

}
catch(error)
{
console.log(error.message)
}

}
const Loadlog = async (req, res) => {
  try {
        res.render('Loginpage',{title:"login page",message:"User saved Successfully"})
    } catch (error) {
        console.log(error.message);
    }
}
const resetpassword=async(req,res)=>{
  try{
    
    //res.render('reset-password',{message:'userData._id'})
    const password=req.body.password
    const cpassword=req.body.cpassword
    console.log(password);
    if(cpassword!=password)
    {
      res.render('reset-password',{message:'two passwords are not matching'})
    }
    const id=req.body.id
    const secure_password=await securepassword(password)
    const updatedData=await user.findByIdAndUpdate({_id:id},{$set:{password:secure_password}})
  req.flash('Loginpage','Password reset successfuly')
  req.session.message="password changed successfully"
    res.redirect('/')
    delete req.session.message
  }
  catch (error) {
    console.log(error.message);
}
}

  
const resendotp=async(req,res)=>{
  try {
    const{username,email,mobile,password}=req.session.tempdata

    const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
        // Generate OTP
        const otp = generateOTP();
    
    const mailOptions = {
      from: 'mdnrj3600@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: `Your again verification code is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  }
  catch(error)
  {
    console.log(error.message);
  }
}

const userLogout = async (req, res) => {
    try {
      console.log(req.session.user,'ytftytfytfy');
        req.session.user=null
        res.redirect('/');

    } catch (error) {
        console.log(error.message);
    }
}

const productdetails=async(req,res)=>{
  try{
    const User=req.session.user
    const Userid=req.query.id
    const productData=await product.findOne({_id:Userid})
    console.log(productData);
    const userdata=await user.findOne({_id:User})
    const CategoryData=await Category.find({})
    if(productData)
    {
   res.render('productdetails',{products:productData,username:userdata.username,category:CategoryData})
    }
    else{
      res.status(200).json({ message: 'Product is  not inside' });
    }
  }
  catch (error) {
    console.log(error.message);
}
}


const shoppage = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const productsPerPage = 6;
    const userId=req.session.user
    
    let productQuery = {isVerified:true};

    // Search
    const search = req.query.search;
    if (search) {
      productQuery.productname = { $regex: new RegExp(search, "i") };
    }

    // Category sorting
    const sortCategory = req.query.id;
    if (sortCategory) {
      console.log("hello guys");
      productQuery.Category = sortCategory;
      console.log(productQuery.Category,"jum jum barabar");
    }

    // Price range
    const priceRange = req.query.priceRange;
    if (priceRange) {
      const [minPrice, maxPrice] = priceRange.split("-");
      productQuery.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice),
      };
    }

    const userdata=await user.findOne({_id:userId})

   const cartdata=await Cart.find({user_id:userId}).countDocuments()
    

    // Apply filters
    const totalNumberOfProducts = await product.find(productQuery).countDocuments();
    const totalNumberOfPages = Math.ceil(totalNumberOfProducts / productsPerPage);

    const productData = await product.find(productQuery)
      .skip((page - 1) * productsPerPage)
      .limit(productsPerPage);

    const categoryData = await Category.find({});
    

    if (productData && categoryData) {
      res.render("user-shop", {
        category: categoryData,
        products: productData,
        page: page,
        totalNumberOfPages,
        currentPage: parseInt(page),
        username:userdata.username,
        cartdata
      });
    }
  }  catch (error) {
    console.log(error.message);
}
};


const applycoupon = async (req, res) => {
  try {
    const { coupon, totalSubtotal } = req.body;
    const userId = req.session.user;

    // Ensure totalSubtotal is parsed as a number
    const parsedTotalSubtotal = parseFloat(totalSubtotal);
    if (isNaN(parsedTotalSubtotal)) {
      return res.status(400).json({ error: 'Invalid total subtotal value' });
    }

    // Query the database to find the coupon by code
    const couponDocument = await Coupon.findOne({ Couponcode: coupon });

    if (!couponDocument) {
      // If coupon code is not found, return error response
      return res.status(409).json({ error: 'Coupon code not found' });
    }

    // Check if the total subtotal is below the minimum amount required for the coupon
    if (parsedTotalSubtotal < couponDocument.Minimumamount) {
      return res.status(400).json({ error: 'Total subtotal is below the minimum amount required for this coupon' });
    }

    // Query the database to find the user
    const userdata = await user.findOne({ _id: userId });

    // Check if the user has already used the coupon
    const couponUsage = userdata.coupons.find(c => c.couponCode === coupon);
    if (couponUsage && couponUsage.usageCount >= couponDocument.Usagelimit) {
      return res.status(404).json({ success: false, message: `You have already used this coupon. This coupon can be used only ${couponDocument.Usagelimit} times` });
    }

    
    if (!couponUsage) {
      // If the user hasn't used the coupon before, create a new entry
      userdata.coupons.push({ couponCode: coupon, usageCount: 1 });
    } else {
      // If the user has used the coupon before, increment the usage count
      couponUsage.usageCount++;
    }

    // Save the changes to the user document
    await userdata.save();

    // Calculate discounted total amount
    let discountedTotal = parsedTotalSubtotal - couponDocument.Amount;

    res.status(200).json({ 
      discount: discountedTotal,
      message: `Coupon code "${coupon}" applied successfully! Discounted total amount: ₹${discountedTotal}`
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ error: 'Failed to apply coupon. Please try again.' });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const { coupon } = req.body;
    const userId = req.session.user;

    // Query the database to find the user
    const userdata = await user.findOne({ _id: userId });

    if (!userdata) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the coupon usage in the user's coupons array
    const couponUsageIndex = userdata.coupons.findIndex(c => c.couponCode === coupon);

    if (couponUsageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Coupon not found in user data' });
    }

    // Decrement the usage count if it's greater than 0
    if (userdata.coupons[couponUsageIndex].usageCount > 0) {
      userdata.coupons[couponUsageIndex].usageCount--;
      await userdata.save();
      return res.status(200).json({ success: true, message: 'Coupon usage count decremented successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Coupon usage count is already at zero' });
    }
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({ error: 'Failed to remove coupon. Please try again.' });
  }
};


  module.exports = {
    Loginload,
    signuppage,
    insertUser,
    verifyLogin,
    Homepage,
    userLogout,
    securepassword,
    Otppage,
    Loadlog,
    VerifyOtp,
    Forget,
    Forgetload,
    forgetpasswordload,
    resetpassword,
    shoppage,
    productdetails,
    resendotp,
    applycoupon,
    removeCoupon
   
}