const express = require('express');
const user_route = express();
const path=require('path')

const session=require('express-session');
const config=require('../configure/config');
user_route.use(
    session({
        secret:process.env.SECRET,
        saveUninitialized: true,
        resave: false,
    }));
console.log("ygyujguj");
user_route.use(express.static('public'));
const auth=require('../Middleware/Auth')
user_route.set('view engine', 'ejs');
user_route.set('views', './views');

const uploader = require("../Multer/multer");
///user_route.use(upload.array("image", 4))

const userController = require('../controllers/user-controller');
const ProfileController=require('../controllers/userprofile-controller')
const CartController=require('../controllers/Cart-controller')
const OrderController=require('../controllers/order-controller')
const CouponController=require("../controllers/admin-controller")

console.log("sdfsf");

console.log("sdshhjhjh");
user_route.get('/signup',userController.signuppage);

// user_route.get('/Otp', userController.Otppage);
user_route.post('/signup',userController.insertUser);
 user_route.post('/VerifyOtp',auth.isLogout,userController.Loadlog);
user_route.post('/resendotp', userController.resendotp);
user_route.post('/Otp', userController.VerifyOtp);
user_route.get('/',userController.Loginload);
user_route.get('/forget-password',userController.Forgetload)
user_route.post('/forget-password',userController.Forget)
user_route.get('/forget-password-load',userController.forgetpasswordload)
user_route.post('/reset-password',userController.resetpassword)


// user_route.get('/login',userController.Loginload);
console.log("giraffe");

user_route.post('/login',userController.verifyLogin);


user_route.get('/home',auth.isLogin,auth.isUserBlocked,userController.Homepage);
user_route.get('/productDetails',auth.isLogin,auth.isUserBlocked,userController.productdetails)
user_route.get('/shop',auth.isLogin,auth.isUserBlocked,userController.shoppage);
user_route.get('/logout',auth.isLogin,auth.isUserBlocked,userController.userLogout);
user_route.get('/cart',auth.isLogin,auth.isUserBlocked,CartController.Cartpage)
user_route.post('/Add-cart',auth.isLogin,auth.isUserBlocked,CartController.addToCart)
user_route.post('/updateQuantity',auth.isLogin,CartController.updateQuantity)
user_route.get('/delete-cart',auth.isLogin,auth.isUserBlocked,CartController.DeleteCart)
user_route.get('/checkout',auth.isLogin,auth.isUserBlocked,CartController.Checkoutpage)
user_route.post('/place-order',auth.isLogin,auth.isUserBlocked,OrderController.orderplaced)
user_route.post('/verify-payment',auth.isLogin,auth.isUserBlocked,OrderController.verifypayment)
user_route.get('/profile',auth.isLogin,auth.isUserBlocked,ProfileController.getprofilepage)
user_route.get('/address-page',auth.isLogin,auth.isUserBlocked,ProfileController.getaddress)
user_route.post('/Add-Address',auth.isLogin,auth.isUserBlocked,ProfileController.NewAddress)
user_route.get('/edit-Address',auth.isLogin,auth.isUserBlocked,ProfileController.editaddress)
user_route.get('/delete-Address',auth.isLogin,auth.isUserBlocked,ProfileController.deleteaddress)
user_route.post('/edit-Address',auth.isLogin,auth.isUserBlocked,ProfileController.updateaddress)
user_route.post('/edit-userdetails',auth.isLogin,auth.isUserBlocked,uploader.single('croppedProfileImageData'),ProfileController.edituserprofile)
user_route.get('/change-password',auth.isLogin,auth.isUserBlocked,ProfileController.editpassword)
user_route.post('/change-password',auth.isLogin,auth.isUserBlocked,ProfileController.changepassword)
user_route.get('/order-detail',auth.isLogin,auth.isUserBlocked,ProfileController.orderdetails)
user_route.get('/download-invoice/:orderId',auth.isLogin,auth.isUserBlocked,ProfileController.orderinfo)
user_route.get('/order-tracks',auth.isLogin,auth.isUserBlocked,ProfileController.ordertracking)
user_route.post('/update-order-status',auth.isLogin,auth.isUserBlocked,ProfileController.updateorderstatus)
user_route.post('/Add-money-to-Wallet',auth.isLogin,auth.isUserBlocked,ProfileController.Addwallet)
user_route.post('/applyCoupon',auth.isLogin,auth.isUserBlocked,userController.applycoupon)
user_route.post('/removeCoupon',auth.isLogin,auth.isUserBlocked,userController.removeCoupon)

user_route.get('/wishlist',auth.isLogin,userController.wishlistpage)
user_route.post('/addtowishlist',auth.isLogin,userController.addtoWishlist)
user_route.get('/removewishlist/:pro',auth.isLogin,userController.removewishlist)
// user_route.get('*',userController.errorpage)
module.exports=user_route