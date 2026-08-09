const user = require('../../models/usermodel');
const product=require('../../models/productmodel');
const Category=require('../../models/categorymodel')
const Cart=require('../../models/Cartmodel')
const Coupon=require('../../models/couponmodel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const randomString = require('randomstring')
const jwt = require('jsonwebtoken')
const mongoose  = require('mongoose')
const banner=require('../../models/Bannermodel')

const currentDate=new Date()



const generateResetToken = (email) => {
  const secretKey = 'your_secret_key';
  const expiresIn = '1h'; 

  const token = jwt.sign({ email }, secretKey, { expiresIn });

  return token;
};


const transporter = nodemailer.createTransport({
  service: 'gmail',
type: "SMTP",
host: "smtp.gmail.com",
port: 587,
secure: false,

    auth: {
      user: process.env.user,
      pass: process.env.pass,
    },
  })
const securepassword = async (password) => {
    
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error);
    }
}

const sendresetpasswordmail=async(username,email,_id,token)=>{

  const mailOptions = {
    from: 'mdnrj3600@gmail.com',
    to: email,
    subject: 'Email Verification',
    html: '<p>Hi '+username+', please click here to <a href="https://www.tech-tique.site/forget-password-load?token='+token+''
  };

  await transporter.sendMail(mailOptions);
}


const Loginload = async (req, res) => {
    
    try {

        if(req.session.user)
        {
          res.redirect('/home')
        }
         else 
        {
         
          let message=req.session.message
        res.render('Loginpage',{title:"login page",message,flashMessage:req.session.flashMessage})}
        
    } catch (error) {
        console.log(error.message);
    }
}




const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
     


    const userdata = await user.findOne({email });
    

    if (userdata) {
      const passwordmatch = await bcrypt.compare(password,userdata.password);
          
      if ((passwordmatch||password===userdata.password)&&userdata.is_admin === 0 && userdata.is_blocked === 0) {
        
        if (!userdata.referalCode) {
         
         userdata.referalCode = crypto.randomBytes(5).toString('hex'); 

          
         try {
            await userdata.save(); 

          } catch (err) {
            console.error("Error saving referral code:", err.message);
          }
        
        }
        req.session.user = userdata._id;
        res.redirect('/home');
      } else if ((passwordmatch||password===userdata.password) && userdata.is_admin === 0 && userdata.is_blocked===1) {
        
        return res.render('Loginpage', { alert: "Your account is blocked" });
      
      } else if(password!==userdata.password||!passwordmatch) {
        
        return res.render('Loginpage', { alert: "Invalid password" });
      }else if (password===userdata.password&&userdata.is_admin === 1) {
        return res.render('Loginpage', { alert: "Invalid user" });
    }} 
    else {
      
      res.render('Loginpage', { alert: "Invalid user details " });
    }
  } catch (error) {
    console.error(error.message);
    throw error; 
  }
};








      

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
    
    const {username,email,phone,password,confirmPassword,referalCode}=req.body
    try {
    

        const hashpassword=await bcrypt.hash(password,10)
        const confirmPassword=hashpassword
        const existingUser = await user.findOne({ email });
        if (existingUser) {
          res.render('Signuppage',{message:'Email already registered' });
        }
        if(confirmPassword!==hashpassword)
        {
         res.render('Signuppage',{message:'Two passwords are not same'})
        }
        const generateOTP = () => Math.floor(100000 + Math.random() * 900000);
        
        const otp = generateOTP();
         const otpexpire=currentDate.getTime()+20000
        
       
        const generatereferalCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();
        const newreferalCode = generatereferalCode();
        let referalUser = null;
        if (referalCode) {
            referalUser = await user.findOne({ referalCode });
        }
    
        const newuser=new user({
      username,
      email,
      phone,
      password,
      is_admin:0,
      otp,
      referalCode:newreferalCode
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
    otp,referalCode:newreferalCode,
  referalUserId:referalUser?referalUser._id:null}

      res.render('Otp',{title:"signup page"})
    
    }

    catch(err)
    {
      console.error('Error saving user:',err)
    
       
      }
    }
    

const VerifyOtp= async (req, res) => {
  
    try {
      const otpinput=currentDate.getTime()

    const enteredOTP = req.body.otp;
    
      
      const {username,email,phone,hashpassword,is_admin,
        isVerified,otp,referalCode,referalUserId}=req.session.tempdata
        

        const newuser = await user.findOne({email:email});
    
    
        let Wallet=0
     if(referalUserId){
      const referwallet=await user.findOne({_id:referalUserId})
   

      if(referwallet)
      {
        Wallet=200
        referwallet.wallet=Wallet
         await referwallet.save()
      }
      else{
        Wallet=0
      }
    }
        const User=new user({
          username:username,
          email:email,
          phone:phone,
          password:hashpassword,
          is_admin:is_admin,
          isVerified:true,
          otp:otp,
          wallet:Wallet,
          referalCode:referalCode
        })
      
        const otpexpire=currentDate.getTime()+20000
        

      
      if (enteredOTP==User.otp) {
        
          User.isVerified =true;
      await User.save();
      
      req.session.message='user saved successfuly'
      res.redirect('/login')
      
   
    } 
      
      else if(enteredOTP!=User.otp)
      {

        res.render('Otp',{message:"Invalid OTP"})
      }
      else {
        res.redirect('/otp')
       
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
     
     const userData=await user.findOne({email:email})
    
     if(userData)
     {
      
      if(userData.isVerified===false)
      {
        
        res.render('forgetpassword',{message:"please verify your mail"})
      }
      else{
      
        const randomstring=randomString.generate()
        const updatedData=await user.findOneAndUpdate({email:email},{$set:{token:randomstring}},{new:true})
        
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

  let userData = null;
    let count = 0;
    let wishcount = 0;
    let carts = [];
    if (req.session.user)
    {
 userData = await user.findOne({_id: req.session.user })


  req.session.user?true:false;
   count=0;
  const wishlistdata = await user.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(req.session.user) } },
    { $group: { _id: null, wishcount: { $sum: { $size: "$wishlist" } } } }
]);


 req.session.wishcount=wishlistdata[0]?.wishcount
 wishcount=req.session.wishcount
  const cartdata=await Cart.aggregate([{$match:{user_id:req.session.user}},{$unwind:"$cartItems"},{$group:{_id:null,count:{"$sum":"$cartItems.quantity"}}}])
  
  
  if(cartdata.length>0)
  {
     count=cartdata[0].count
     
  }
  else
  {
    count=0
  }  
  req.session.count=count

  
   count=req.session.count
    const carts=await Cart.find({user_id:req.session.user}).populate('cartItems.product_id')
    
    carts.forEach(cart => {
      cart.cartItems.forEach(cartItem => {

      });
  });
}
const productData=await product.find({isVerified:true})
const CategoryData=await Category.find({})
  const bannerdata=await banner.find({status:"active"})

  res.render('userhome',{username:userData?.username??null,products:productData,category:CategoryData,count,wishcount,cart:carts,banners:bannerdata})
  

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
    
    
    const password=req.body.password
    const cpassword=req.body.cpassword
    
    if(cpassword!=password)
    {
      res.render('reset-password',{message:'two passwords are not matching'})
    }
    const id=req.body.id
    const secure_password=await securepassword(password)
    const updatedData=await user.findByIdAndUpdate({_id:id},{$set:{password:secure_password}})
  req.flash('Loginpage','Password reset successfuly')
  req.session.message="password changed successfully"
    res.redirect('/login')
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

const logRedirect = async (req, res) => {
  try {
     res.redirect('/home')
  } catch (error) {
      console.log(error.message);
  }
}
const userLogout = async (req, res) => {
    try {

        req.session.user=null
        res.redirect('/login');

    } catch (error) {
        console.log(error.message);
    }
}

const productdetails=async(req,res)=>{
  try{
    const User=req.session.user
    const Userid=req.query.id
    const productData=await product.findOne({_id:Userid})
    
    const userdata=await user.findOne({_id:User})
    const CategoryData=await Category.find({})
    if(productData)
    {
      let count=req.session.count

      const cartdata=await Cart.aggregate([{$match:{user_id:req.session.user}},{$unwind:"$cartItems"},{$group:{_id:null,count:{"$sum":"$cartItems.quantity"}}}])
      
      
      if(cartdata.length>0)
      {
         count=cartdata[0].count
      }
      else
      {
        count=0
      }
      req.session.count=count
      let wishcount=req.session.wishcount
      let relatedproducts=await product.find({})
   res.render('productdetails',{products:productData,username:userdata?.username??null,category:CategoryData,count,relatedproducts,wishcount,search:req.query.search})
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

    
    const search = req.query.search;
    if (search) {
      productQuery.productname = { $regex: new RegExp(search, "i") };
    }

    
    const sortCategory = req.query.category;
    if (sortCategory) {
      
      productQuery.Category = sortCategory;

    }

    
    const priceRange = req.query.priceRange;
    if (priceRange) {
      if (priceRange === "greater than 50000") {
        productQuery.price = { $gt: 50000 };
      } else {
      const [minPrice, maxPrice] = priceRange.split("-");
      productQuery.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice),
      };
    }}

    const sortoption=req.query.sort
    let sortcriteria={}
    if(sortoption=="lowtohigh")
    {
      sortcriteria={price:1}
    }
    else if(sortoption=="hightolow")
    {
      sortcriteria={price:-1}
    }
    else if(sortoption=="atoz")
    {
      sortcriteria={productname:1}
    }
    else if(sortoption=="ztoa")
    {
      sortcriteria={productname:-1}
    }

    const userdata=await user.findOne({_id:userId})

   
   let count=0;

   const cartdata=await Cart.aggregate([{$match:{user_id:req.session.user}},{$unwind:"$cartItems"},{$group:{_id:null,count:{"$sum":"$cartItems.quantity"}}}])
   
   
   if(cartdata.length>0)
   {
      count=cartdata[0].count
   }
   else
   {
     count=0
   }
   req.session.count=count
   
    let username = null;


    if (userId) {
      const userdata = await user.findById(userId);
      username = userdata?.username;

      const cartdata = await Cart.aggregate([
        { $match: { user_id: userId } },
        { $unwind: "$cartItems" },
        { $group: { _id: null, count: { $sum: "$cartItems.quantity" } } },
      ]);
      count = cartdata[0]?.count || 0;
      req.session.count = count;

      wishcount = req.session.wishcount || 0;
    }
      wishcount=req.session.wishcount||0
    
    const totalNumberOfProducts = await product.countDocuments(productQuery);
    const totalNumberOfPages = Math.ceil(totalNumberOfProducts / productsPerPage);

    const productData = await product.find(productQuery)
      .sort(sortcriteria)
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
        username:userdata?.username??null,
        count,
        wishcount:wishcount||0,
        priceRange,
        sort:sortoption,
        search:req.query.search,
        categoryId:req.query.category
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
    
    
     req.session.coupon=coupon

    const parsedTotalSubtotal = parseFloat(totalSubtotal);
    if (isNaN(parsedTotalSubtotal)) {
      return res.status(400).json({ error: 'Invalid total subtotal value' });
    }

    const couponDocument = await Coupon.findOne({ Couponcode: coupon });

    if (!couponDocument) {

      return res.status(409).json({ error: 'Coupon code not found' });
    }


    if (parsedTotalSubtotal < couponDocument.Minimumamount) {
      return res.status(400).json({ error: 'Total subtotal is below the minimum amount required for this coupon',miniamount:couponDocument.Minimumamount });
    }


    const userdata = await user.findOne({ _id: userId });

    const couponUsage = userdata.coupons.find(c => c.couponCode === coupon);
    if (couponUsage && couponUsage.usageCount >= couponDocument.Usagelimit) {
      return res.status(404).json({ success: false, message: `You have already used this coupon. This coupon can be used only ${couponDocument.Usagelimit} times` });
    }
    
    await userdata.save();
    
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

    const userdata = await user.findOne({ _id: userId });

    if (!userdata) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const couponUsageIndex = userdata.coupons.findIndex(c => c.couponCode === coupon);
      if(req.session.coupon)
      {
        req.session.coupon=''
      return res.status(200).json({ success: true, message: 'Coupon has been removed successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Coupon usage count is already at zero' });
    }
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({ error: 'Failed to remove coupon. Please try again.' });
  }
}


const errorpage=async(req,res)=>{
  try{

    res.render('404')
  }
  catch(error)
  {
    console.log(error.message);
  }
}

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
    removeCoupon,

    errorpage,
    logRedirect
   
}
