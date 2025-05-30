const express = require('express');
const admin_route = express();
const path=require('path')
const multer = require('multer');
const session = require('express-session');
const config=require('../configure/config');


// const upload = multer({ dest: '../public/productImage' })

admin_route.use(
    session({
        secret:process.env.SECRET,
        saveUninitialized: true,
        resave: false
    }))
admin_route.use(express.static('public'));
const uploader =require("../Multer/multer")

admin_route.set('view engine', 'ejs');
admin_route.set('views', './views'); 
const auth=require('../Middleware/Admin-auth')

const adminController = require('../controllers/admin/admin-controller')

const categoryController=require('../controllers/admin/category-controller')
const bannercontroller=require('../controllers/admin/banner-controller')
const productController=require('../controllers/admin/product-controller')
const salesController=require('../controllers/admin/sales-controller')
const couponController=require('../controllers/admin/coupon-controller')
// admin_route.get('/',adminController.loginload);
// admin_route.get('/login',adminController.loginload);
// admin_route.post('/login',adminController.verifyLogin)

admin_route.get('/',adminController.loginload);

admin_route.post('/login',adminController.verifyLogin);


admin_route.get('/home',auth.isLogin, adminController.loadhomepage);

admin_route.get('/logout',auth.isLogin,adminController.logout);

admin_route.get('/users',auth.isLogin,adminController.adminDashboard);

// admin_route.get('/new-user',auth.isLogin,adminController.newUserLoad);

// admin_route.post('/new-user',adminController.addUser);

// admin_route.get('/edit-user',auth.isLogin,adminController.editUserLoad);

admin_route.put('/toggle-user-status',adminController.updateUserBlockStatus);
admin_route.get('/unblock-user',adminController.unblockUser);
// admin_route.get('/delete-user',adminController.deleteUsers);
admin_route.get('/products-list',auth.isLogin,productController.productslist)
admin_route.get('/Add-product',auth.isLogin,productController.Addproducts)
admin_route.post('/Add-product',auth.isLogin,uploader.array('image',4),productController.insertproduct)
admin_route.get("/categories",auth.isLogin,categoryController.loadCategoriesPage);
  admin_route.get("/delete-category",auth.isLogin,categoryController.deleteCategory);
  admin_route.post("/categories",auth.isLogin,categoryController.addCategory);
  admin_route.post("/update-category",auth.isLogin,categoryController.updateCategory);
  admin_route.get('/edit-product',auth.isLogin,productController.loadEditProduct)
  admin_route.post('/delete-single-image',auth.isLogin,productController.deleteSingleImage);
  admin_route.post("/update-product",uploader.array('image',4),auth.isLogin,productController.updateProducts);
  admin_route.get("/delete-product",auth.isLogin,productController.deleteProduct)
  admin_route.get("/orderlist",auth.isLogin,adminController.Orderlistpage)
  admin_route.get('/order-detail',auth.isLogin,adminController.orderdetails)
  admin_route.get('/order-tracks',auth.isLogin,adminController.ordertracking)
  admin_route.post('/update-order-status',auth.isLogin,adminController.updateorderstatus)
  admin_route.get('/delete-order',auth.isLogin,adminController.deleteOrder)
  admin_route.get('/saleschart',auth.isLogin,salesController.saleschart)
  admin_route.get('/orderschart',auth.isLogin,salesController.ordersChart)
  admin_route.get('/revenuechart',auth.isLogin,salesController.revenueChart)
  admin_route.get('/productcountchart',auth.isLogin,salesController.productCountChart)
  admin_route.get('/banner-upload',auth.isLogin,bannercontroller.bannerupload)
  admin_route.post('/banner-uploads',auth.isLogin,uploader.single('croppedImageData'),bannercontroller.insertBanner)
  admin_route.post("/update-banners",auth.isLogin,bannercontroller.updatebanners)
  admin_route.get('/bannerlist',auth.isLogin,bannercontroller.bannerlist)
  admin_route.get('/sales-report',auth.isLogin,salesController.salesreport);
 // admin_route.get('/filter-sales-report',auth.isLogin,adminController.filtersalesreport);
  // Route to get sales report by week
admin_route.get('/sales/weekly', auth.isLogin,salesController.salesweekly)
 

// Route to get sales report by month
admin_route.get('/sales/monthly',auth.isLogin,salesController.salesmonthly);

// Route to get sales report by year
admin_route.get('/sales/yearly',auth.isLogin,salesController.salesyearly);
admin_route.get('/sales/daily',auth.isLogin,salesController.salesdaily);
admin_route.get('/sales/all',auth.isLogin,salesController.salesAlltime)
admin_route.get('/new-coupon',auth.isLogin,couponController.couponpage);
admin_route.post('/Add-new-coupon',auth.isLogin,couponController.newCoupon)
admin_route.get('/coupons',auth.isLogin,couponController.Couponlist);
admin_route.get('/delete-coupon',auth.isLogin,couponController.coupondelete);
admin_route.get('/edit-coupon',auth.isLogin,couponController.couponeditpage);
admin_route.post('/update-coupon',auth.isLogin,couponController.couponupdate);
admin_route.post('/add-Categoryoffer',auth.isLogin,categoryController.addCategoryOffer);
admin_route.post('/Remove-Categoryoffer',auth.isLogin,categoryController.removerCategoryOffer);
admin_route.get('/download-pdf',auth.isLogin,adminController.downloadpdf);
admin_route.get('/download-excel',auth.isLogin,adminController.downloadExcel);
admin_route.post('/Add-productoffer',auth.isLogin,adminController.Addproductoffer);
admin_route.post('/Remove-productOffer',auth.isLogin,adminController.removeproductoffer);
admin_route.get('/logout',auth.isLogout,adminController.logout)
// admin_route.get('*', function (req, res) {
//     res.redirect('/login'))
// });

module.exports = admin_route;
