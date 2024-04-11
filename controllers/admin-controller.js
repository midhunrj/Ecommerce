const user = require('../models/usermodel')
const product = require('../models/productmodel');
const Category = require('../models/categorymodel')
const Order=require('../models/ordermodel')
const Coupon=require('../models/couponmodel')

const _=require("lodash")
const bcrypt = require('bcrypt');
const exceljs=require("exceljs")
const fs=require('fs')
const moment = require('moment');
const path = require('path');
const sharp=require("sharp")
const PDFDocument=require("pdfkit-table")

// const randomString = require('randomstring')


const securepassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error);
  }
}

const loginload = async (req, res) => {
  try {
    // res.setHeader("Cache-Control","no-store ,max-age=0");
    console.log("Admin login page");
    if(req.session.admin) {
      res.redirect('/admin/home')
    }
    else{
    res.render('login', { title: "login page" })
    console.log("hey i am going");
 } } catch (error) {
    console.log(error.message);
  }
}

const verifyLogin = async (req, res) => {

  console.log('adminnnnnn');
  try {
    const Email = req.body.email
    const password = req.body.password
    console.log(Email,"email");
    const userdata = await user.findOne({email:Email})
    console.log(userdata);
    if (userdata) {
      console.log("mir");
      // const passwordmatch = bcrypt.compare(password, userdata.password)
      console.log('joi')

      if (password===userdata.password&&userdata.is_admin === 1) {

        console.log('admin');
        req.session.admin = userdata._id
        console.log("admin id",req.session.admin);
        console.log("hi")
        
        res.redirect('/admin/home')
        console.log('jk')
      }
      else if (password !== userdata.password) {

        res.render('login', { alert: "invalid passsword" })
      }
     
    }
      else {
        res.render('login', { alert: "invalid user details" })
      }
    

  } catch (error) {
    console.log(error.message);
  }
}
const getRevenueData = async () => {
  try {
      // Fetch revenue data from your database
      const revenueData = await Order.aggregate([
          {
              $match: {
                  Order_verified: true,
                  $or: [
                      { Status: "Delivered" },
                      { paymentstatus: "paid" }
                  ]
              }
          },
          {
              $group: {
                  _id: null,
                  totalRevenue: { $sum: "$Totalprice" } // Calculate total revenue
              }
          }
      ]);

      return revenueData[0] ? revenueData[0].totalRevenue : 0; // Return total revenue
  } catch (error) {
      console.error('Error fetching revenue data:', error);
      return 0; // Return 0 in case of error
  }
};
const getTopSellingProducts = async () => {
  // Fetch all products
  const products = await product.find({ isVerified: true });

  // Aggregate order data to count occurrences of each product
  const topSellingProducts = await Order.aggregate([
      { $match: { Order_verified: true } },
      { $unwind: "$products" },
      { $group: { _id: "$products", ordersCount: { $sum: 1 } } }
  ]);

  // Assign orders count to respective products
  for (const product of products) {
      const matchingProduct = topSellingProducts.find(item => item._id.toString() === product._id.toString());
      if (matchingProduct) {
          product.ordersCount = matchingProduct.ordersCount;
      } else {
          product.ordersCount = 0;
      }
  }

  return products;
};

const getTopSellingProductsByCategory = async () => {
  // Fetch all categories
  const categories = await Category.find({});

  // Initialize array to store top selling products by category
  const topSellingProductsByCategory = [];

  // Loop through each category
  for (const category of categories) {
      // Fetch products for the current category
      const products = await product.find({ Category: category._id, isVerified: true });

      // Aggregate order data to count occurrences of each product within the category
      const topSellingProducts = await Order.aggregate([
          { $match: { Order_verified: true } },
          { $unwind: "$products" },
          { $match: { "products.Category": category._id } },
          { $group: { _id: "$products", ordersCount: { $sum: 1 } } },
          { $sort: { ordersCount: -1 } },
          { $limit: 3 } // Get top 3 selling products per category
      ]);

      // Assign orders count to respective products
      for (const product of products) {
          const matchingProduct = topSellingProducts.find(item => item._id.toString() === product._id.toString());
          if (matchingProduct) {
              product.ordersCount = matchingProduct.ordersCount;
          } else {
              product.ordersCount = 0;
          }
      }

      // Push category and its top selling products to the result array
      topSellingProductsByCategory.push({ category, products });
  }

  return topSellingProductsByCategory;
};

const loadhomepage = async (req, res) => {
  try {
    const userId = req.session.admin;
    if (!userId) {
      // Redirect if user is not logged in
      return res.redirect("/admin/");
    }

    const userData = await user.findById(userId);
    const orders=await Order.find({Order_verified:true})
    const productdata=await product.find({isVerified:true})
    ;

    const topSellingProducts = await Order.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products.product", totalQuantity: { $sum: "$products.quantity" } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, // Populate product details
      { $unwind: "$product" },
      { $project: { _id: "$product._id", productname: "$product.productname",image: "$product.image", totalQuantity: 1 } }
  ]);
    
    const topSellingProductsByCategory = await getTopSellingProductsByCategory();

  
    const currentPage = parseInt(req.query.page) || 1; 
    const perPage = 10; // 

   
    const totalOrders = await Order.countDocuments({ Order_verified: true });
    const totalPages = Math.ceil(totalOrders / perPage);

    
    const orderdata = await Order
      .find({ Order_verified: true })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

   
    const catdata = await Category.find({});

    // Fetch revenue data
    const revenue = await getRevenueData();

    res.render('homesample', {
      username: userData.username,
      orders: orderdata,
      revenue,
      products:productdata,
      categories: catdata,
      currentPage, 
      totalPages,
      topSellingProducts,
      topSellingProductsByCategory 
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const logout = async (req, res) => {
  try {
    console.log("ENTER TO LOGOUT");
    console.log(req.session.admin,"IDD");
    req.session.admin=null;
    console.log(req.session.admin,"iidddd");
    res.redirect('/admin/');
  } catch (error) {
    console.log(error.message);
  }
}
const adminDashboard = async (req, res) => {
  try {
    const page = req.query.page || 1; // Default to page 1
    const usersPerPage = 4; // Adjust the number of users per page as needed

    let userQuery = { is_admin: 0 }; // Query to filter non-admin users
     
    // Search
    const search = req.query.search;
    if (search) {
      userQuery.username = { $regex: new RegExp(search, "i") }; // Search by username
    }

    const totalNumberOfUsers = await user.find(userQuery).countDocuments();
    const totalNumberOfPages = Math.ceil(totalNumberOfUsers / usersPerPage);

    // Ensure the requested page does not exceed the total number of pages
    const validPage = Math.min(page, totalNumberOfPages);

    const userData = await user.find(userQuery)
      .skip((validPage - 1) * usersPerPage)
      .limit(usersPerPage);

    if (userData) {
      res.render('users-list', {
        users: userData,
        
        page: validPage,
        totalNumberOfPages,
        searchQuery: search, // Pass the search query to the view
      });
    }
  } catch (error) {
    console.log(error.message);
    // Handle error appropriately, e.g., send an error response
    res.status(500).send('Error loading user list');
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
}

const blockUser = async (req, res) => {
  try {
    console.log("enteeeeeeeeeeeeeeeeeeeeer");
    const userId = req.query.id;

    const userData = await user.findOne({ _id: userId });

    if (userData) {
      
      userData.is_blocked = 1
      
      res.redirect("/admin/users")
      await userData.save();
    } else {
      console.error("Failed to block user: User not found");
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    
  }
};

const unblockUser = async (req, res) => {
  try {
    console.log("mreshhjggjgg");
    const userId = req.query.id;

    const userData = await user.findOne({ _id: userId });

    if (userData) {
      
      userData.is_blocked = 0
      
      res.redirect('/admin/users')
      await userData.save();
    } else {
      console.error("Failed to block user: User not found");
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error in blockUser:", error.message);
    res.status(500).send("Internal Server Error");
  }
};







const productslist = async (req, res) => {
  try {
    const productData = await product.find({ isVerified: true })
    const CategoryData=await Category.find({})
    res.render('admin-products', { products: productData,category:CategoryData })
  }
  catch (error) {
    console.log(error.message);
  }
}
const Addproducts = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("Admin-add-pro", { category: categoryData });

  }
  catch (error) {
    console.log(error.message);
  }
}
// const insertproduct = async (req, res) => {
//   try {
//     const { productname, Color, price, description, stock, Brand, Category } = req.body;
//     console.log("Adding new product");
//     console.log("Request body:", req.body);
//     console.log(req.files);
    
//     // Process each uploaded image to crop and save it
//     const croppedImages = [];
//     for (const file of req.files) {
//       console.log(file, "file");
      
//       // Read the uploaded image
//       const image = sharp(file.path);
//       // console.log("Image metadata:", await image.metadata()); // Log image metadata
      
//       // Perform cropping (example: crop to 300x300 square)
//       const croppedImageBuffer = await image
//         .resize({ width: 650, height: 500, fit: 'outside' })  // Resize to 300x300 and maintain aspect ratio
//         .toBuffer();  // Convert to buffer
//       console.log("Cropped image buffer length:", croppedImageBuffer.length); // Log length of cropped image buffer
      
//       // Generate a unique filename for the cropped image
//       const croppedImageFilename = `cropped_${Date.now()}_${file.originalname}`;
         
//       // Save the cropped image to the specified directory
//       await sharp(croppedImageBuffer).toFile(path.join('public', 'productImage', croppedImageFilename));
//       console.log("Cropped image saved:", croppedImageFilename); // Log filename of saved cropped image
      
//       // Store the filename of the cropped image
//       croppedImages.push(croppedImageFilename);
//     }

//     console.log(Category);

//     // Create a new product instance
//     const newProduct = new product({
//       productname,
//       Color,
//       price,
//       description,
//       stock,
//       Brand,
//       image: croppedImages,  // Use the filenames of the cropped images
//       Category: Category
//     });

//     // Save the new product to the database
//     await newProduct.save();

//     // Respond to the client with a success message
//     res.redirect('/products-list');
//   } catch (error) {
//     console.error('Error adding product:', error);
//     res.status(500).json({ error: 'Failed to add product' });
//   }
// };
const insertproduct = async (req, res) => {
  try {

      const { productname, Color, price, description, stock, Brand, Category } = req.body;
      const croppedImages = req.files.map(file => file.filename); // Extract filenames of cropped images from req.files array

      // Create a new product instance
      const newProduct = new product({
          productname,
          Color,
          price,
          description,
          stock,
          Brand,
          image: croppedImages, // Use the filenames of the cropped images
          Category
      });

      // Save the new product to the database
      await newProduct.save();
      // Respond to the client with a success message
      res.redirect('/admin/products-list');
  } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
  }
};
 
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await product.findById(id);
    const categoryData = await Category.find({ is_active: false });
 
    if (productData&&categoryData) { 
      res.render("editproduct", {
        products: productData,
        category: categoryData,
      });
    } else {
      res.redirect("/admin/products-list");
    }
  } catch (error) {
    handleServerError(res, error, "Error loading edit product page");
  }
};  


const deleteProduct = async (req, res) => {
  try {
    console.log("entering");
    const id = req.query.id;
    const result = await product.updateOne({ _id: id },{$set:{isVerified:false}});

   res.redirect('/admin/products-list')

    
  } catch (error) {
    handleServerError(res, error, "Error deleting product");
  }
};

const updateProducts = async (req, res) => {
  try {
    console.log(req.body); // Should now include form data
    console.log(req.file);
    console.log("Entering updateProducts");
    const _id = req.body.id;
    

    console.log("Product ID:", _id);

    const {
      productname,
      Brand,
      Description,
      Price,
      Size,
    } = req.body;
    console.log("Request Body:", req.body);

    console.log(req.files);
    const images = req.files
    console.log("Image Details:", images);

    let imageArray = [];

    if (images) {
      console.log("Image file entered");

      // Ensure imageArray is an array containing the filename
      imageArray =  req.files.map(file => file.filename);
    }

    const existingProduct = await product.findById(_id);
   

    const updatedImages = [...existingProduct.image, ...imageArray];
    console.log("Updated Images:", updatedImages);

    if (!existingProduct) {
      // Handle the case where the product with the specified ID is not found
      return res.status(404).json({ error: 'Product not found' });
    }

    //Concatenate existing images and the new image filename
    
    const productData = await product.findByIdAndUpdate(
      _id,
      {
        productname: productname,
        Brand: Brand,
        description: Description,
        price: Price,
        stock: Size,
        // Include any other fields you need to update
        image:updatedImages,
        
      },
      { new: true } // To get the updated document as a result
    );

    if (productData) {
      res.redirect("/admin/products-list");
    } else {
      // Handle the case where the product update fails
      res.status(500).json({ error: 'Failed to update product' });
    }
  } catch (error) {
    // Handle errors that occur during the update process
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to edit products' });
  }
};

const deleteSingleImage = async (req, res) => {
  try {
    const { productId, filename } = req.body;
    console.log("this is pro", productId, "\nthis is file", filename);
    console.log("gingika");

    const products = await product.findById(productId);

    console.log("plinch");
    if (!products) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    console.log("hello guys");
    const imageIndex = products.image.findIndex(
      (img) => img === filename
    );

    console.log("image index is here", imageIndex);
    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found in the product" });
    }

    console.log("hl my friend");
    products.image.splice(imageIndex, 1);

    await products.save();

    console.log("fly high");
    const filePath = `public/productImage/${filename}`;

    // Check if the file exists before trying to delete
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res
            .status(500)
            .json({ success: false, error: "Error deleting file" });
        }
        console.log("jigarthanda");
        return res
          .status(200)
          .json({ success: true, message: "Image deleted successfully" });
      });
    } else {
      console.log("File not found:", filePath);
      return res
        .status(404)
        .json({ success: false, error: "File not found" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
const Orderlistpage = async (req, res) => {
  try {
    console.log(req.query.page,"current page");
    const page = req.query.page || 1; // Default to page 1
    const ordersPerPage = 5; // Adjust the number of orders per page as needed

    const totalNumberOfOrders = await Order.find({ Order_verified: true }).countDocuments();
    const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);

    // Ensure the requested page does not exceed the total number of pages
    const validPage = Math.min(page, totalNumberOfPages);

    const orderData = await Order.find({ Order_verified: true })
      .skip((validPage - 1) * ordersPerPage)
      .limit(ordersPerPage).sort({placedon:-1});
      const userdata=await user.find({is_admin:0})
    
      console.log("orderlist dta",orderData);
    if (orderData) {
      res.render('Admin-orderlist', {
        orders: orderData,
        page: validPage,
        totalNumberOfPages,
        users:userdata
      });
    }
  } catch (error) {
    console.log(error.message);
    // Handle error appropriately, e.g., send an error response
    res.status(500).send('Error loading order list');
  }
};

const orderdetails=async(req,res)=>{
  try
  {
    const orderid=req.query.id
   
    const orderData=await Order.findById(orderid)
    const userdata=await user.findById(orderData.userId)
    const productIds = orderData.products.map(product => product.product);
    const productdata = await product.find({ _id: { $in: productIds } });
    res.render('admin-order-details',{users:userdata,orders:orderData,products:productdata})
    console.log("productdata",productdata);
    
  }
  catch (error) {
    console.log(error.message);
  }
}

const ordertracking=async(req,res)=>{
  try{
    const orderid=req.query.id
   
    const orderData=await Order.findById(orderid)
    const userdata=await user.findById(orderData.userId)
    res.render('admin-order-tracking',{users:userdata,orders:orderData})
  }
  catch (error) {
    console.log(error.message);
  }
}
const updateorderstatus = async (req, res) => {
  try {
      const { orderID, newStatus } = req.body;
      console.log("orderID", orderID, "\n newStatus", newStatus);

      
      const updatedOrder = await Order.findOneAndUpdate({ _id: orderID }, { Status: newStatus }, { new: true });

      
      if (newStatus === 'Cancelled' && updatedOrder) {
          
          for (const productItem of updatedOrder.products) {
              const productId = productItem.product;
              const quantity = productItem.quantity;
              console.log("updatedorder",updatedOrder);

              
              const Product = await product.findById(productId);
            console.log("products restroe time aagaya",Product);
              
              if (Product) {
                  Product.stock += quantity; 
                  await Product.save();
                  console.log("products after restoring\n ratatata !!!! ratattaaatata",Product);
              }
          }
      }
      else if(newStatus=="Delivered"&& updatedOrder)
      {
        await Order.findOneAndUpdate({_id:orderID},{$set:{paymentstatus:"paid"}})
      }

      
      res.status(200).json({ success: true, updatedOrder });
  } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Error updating order status' });
  }
}
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.query.id;
    const page = req.query.page;

    // Delete the order from the database
    await Order.findByIdAndDelete(orderId);

    // Redirect to the order list page with the current page number
    res.redirect(`/admin/orderlist?page=${page}`);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Error deleting order');
  }
};

const salesreport=async(req,res)=>{
  try{
    console.log(req.query.page);
    const page=req.query.page||1;
    console.log(page,"pages");
    const ordersperpage=8;
    const timeRange = req.query.timeRange || 'yearly'; // Default to yearly if not provided
    const statusFilter = req.query.status || 'All'; // Default to All if not provided
    
    console.log("Time Range Filter:", timeRange);
    console.log("Status Filter:", statusFilter);

    const totalNumberOfOrders=await Order.find({Order_verified:true,$or: [
      {Status: "Delivered" },
      { paymentstatus: "paid" }
  ]}).countDocuments()
    const totalNumberOfPages=Math.ceil(totalNumberOfOrders/ordersperpage)
    console.log("totalpage",totalNumberOfPages);
    const userData=await user.findOne({_id:req.session.admin})
    const productdata=await product.find({isVerified:true})
    const catdata=await Category.find({})
    const validpage=Math.min(page,totalNumberOfPages)
    console.log("valid pag",validpage);
    const orderdata = await Order.find({
      Order_verified: true,
      $or: [
          { Status: "Delivered" }
      ]
  }).sort({placedon:-1}).skip((validpage - 1) * ordersperpage)
    .limit(ordersperpage);
     console.log("orderdata",orderdata);
     if(orderdata){
      
      res.render('sales-report', { username: userData.username,totalNumberOfPages,page:validpage,products:productdata,timeRange,statusFilter,
        orders:orderdata,
        categories:catdata, })
      }
  }
  catch(error){
    console.log(error.message);
  }
}

const salesweekly=async (req, res) => {
  try{
  console.log("hello week ");
  const statusFilter = req.query.status || '';

  const startOfWeek = moment().startOf('week');
  const endOfWeek = moment().endOf('week');

  // Apply the status filter to your MongoDB query
  const weeklyOrders = await Order.find({
    $or: [
      { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" },
      { placedon: { $gte: startOfWeek, $lte: endOfWeek }, paymentstatus: "paid" }
  ]}).sort({placedon:-1})
       // Modify this to match your schema
 

  // Send the filtered orders to the frontend
  res.json(weeklyOrders);
}
catch(error)
{
  console.log(error.message);
}}

const salesmonthly=async (req, res) => {
  try{
    console.log("hello month");
  const statusFilter = req.query.status || '';

  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');

  // Apply the status filter to your MongoDB query
  const monthlyOrders = await Order.find({
    $or: [
      { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
      { placedon: { $gte: startOfMonth, $lte: endOfMonth }, paymentstatus: "paid" }
  ]}).sort({placedon:-1})
      // Modify this to match your schema
  

  // Send the filtered orders to the frontend
  res.json(monthlyOrders);
}
catch(error)
{
  console.log(error.message);
}
}
const salesyearly=async (req, res) => {
  try {
    console.log("hello yearly");
  const statusFilter = req.query.status || '';

  const startOfYear = moment().startOf('year');
  const endOfYear = moment().endOf('year');

  // Apply the status filter to your MongoDB query
  const yearlyOrders = await Order.find({
    $or: [
      { placedon: { $gte: startOfYear, $lte: endOfYear }, Status: "Delivered" },
      { placedon: { $gte: startOfYear, $lte: endOfYear }, paymentstatus: "paid" }
  ]}).sort({placedon:-1})
       // Modify this to match your schema
 

  // Send the filtered orders to the frontend
  res.json(yearlyOrders);
}
catch(error)
{
  console.log(error.message);
}}
const salesdaily=async(req,res)=>{
  try{
    console.log("hello daily");

    const startOfDay=moment().startOf('day');
    const endOfDay=moment().endOf('day')

    const dailyorders=await Order.find({$or: [
      { placedon: { $gte: startOfDay, $lte: endOfDay }, Status: "Delivered" },
      { placedon: { $gte: startOfDay, $lte: endOfDay }, paymentstatus: "paid" }
  ]}).sort({placedon:-1})
    res.json(dailyorders)
  }catch(error)
  {
    console.log(error.message);
  }
}
const saleschart = async (req, res) => {
  try {
      // Get the time range (e.g., monthly, weekly, daily) from query params
      const timeRange = req.query.timeRange || 'monthly'; // Default to monthly if not provided

      // Calculate the start date based on the specified time range
      let startDate;
      if (timeRange === 'weekly') {
          startDate = moment().startOf('year').toDate();
      } else if (timeRange === 'daily') {
          startDate = moment().subtract(7, 'days').startOf('day').toDate();
      } else {
          startDate = moment().subtract(3, 'months').startOf('month').toDate();
      }

      // Aggregate orders data based on the specified time range and start date
      const salesData = await Order.aggregate([
          {
              $match: {
                  Order_verified: true,
                  $or: [
                      { Status: "Delivered" }
                  ],
                  placedon: { $gte: startDate } // Filter orders placed after the start date
              }
          },
          {
              $group: {
                  _id: {
                      $cond: [ // Group by month, week, or day based on the specified time range
                          { $eq: [timeRange, 'weekly'] },
                          { $isoWeek: "$placedon" }, // Group by ISO week for weekly data
                          { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$placedon" }, { $month: "$placedon" }] } // Group by day for daily data, month for monthly data
                      ]
                  },
                  totalSales: { $sum: 1 } // Count the number of orders
              }
          },
          { $sort: { "_id": 1 } } // Sort by month, week, or day
      ]);

      // Format the fetched data as needed for the frontend chart
      const labels = salesData.map(item => {
          if (timeRange === 'weekly') {
              return `Week ${item._id}`;
          } else if (timeRange === 'daily') {
              return moment(item._id).format('MMMM Do, YYYY');
          } else {
              return moment().month(item._id - 1).format('MMMM');
          }
      });

      const datasets = [{
          label: 'Sales',
          data: salesData.map(item => item.totalSales)
      }];

      // Send the formatted sales data as a response
      res.json({ labels, datasets });
  } catch (error) {
      console.error('Error fetching sales chart data:', error);
      res.status(500).json({ error: 'Failed to fetch sales chart data' });
  }
}
const revenueChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly'; // Default to monthly if not provided
    let startDate;
    if (timeRange === 'weekly') {
      startDate = moment().startOf('year').toDate();
    } else if (timeRange === 'daily') {
      startDate = moment().subtract(7, 'days').startOf('day').toDate();
    } else {
      startDate = moment().subtract(3, 'months').startOf('month').toDate();
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          Order_verified: true,
          $or: [
            { Status: "Delivered" },
            { paymentstatus: "paid" }
          ],
          placedon: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [timeRange, 'weekly'] },
              { $isoWeek: "$placedon" },
              { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$placedon" }, { $month: "$placedon" }] }
            ]
          },
          totalRevenue: { $sum: "$Totalprice" }, // Assuming total_price field contains the revenue for each order
          totalOrders: { $sum: 1 } // Count the number of orders
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const labels = revenueData.map(item => {
      if (timeRange === 'weekly') {
        return `Week ${item._id}`;
      } else if (timeRange === 'daily') {
        return moment(item._id).format('MMMM Do, YYYY');
      } else {
        return moment().month(item._id - 1).format('MMMM');
      }
    });

    const datasets = [{
      label: 'Revenue',
      data: revenueData.map(item => item.totalRevenue)
    }, {
      label: 'Orders Count',
      data: revenueData.map(item => item.totalOrders)
    }];

    console.log(labels,datasets,"revenue charts");
    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue chart data' });
  }
}

const ordersChart = async (req, res) => {
  try {
      const timeRange = req.query.timeRange || 'monthly'; // Default to monthly if not provided
      let startDate;
      if (timeRange === 'weekly') {
          startDate = moment().startOf('year').toDate()
      } else if (timeRange === 'daily') {
          startDate = moment().subtract(7, 'days').startOf('day').toDate();
      } else {
          startDate = moment().subtract(3, 'months').startOf('month').toDate();
      }

      const ordersData = await Order.aggregate([
          {
              $match: {
                  Order_verified: true,
                  $or: [
                      { Status: "Confirmed" },
                      { paymentstatus: "paid" }
                  ],
                  placedon: { $gte: startDate }
              }
          },
          {
              $group: {
                  _id: {
                      $cond: [
                          { $eq: [timeRange, 'weekly'] },
                          { $isoWeek: "$placedon" },
                          { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$placedon" }, { $month: "$placedon" }] }
                      ]
                  },
                  totalOrders: { $sum: 1 } // Count the number of orders
              }
          },
          { $sort: { "_id": 1 } }
      ]);

      const labels = ordersData.map(item => {
          if (timeRange === 'weekly') {
              return `Week ${item._id}`;
          } else if (timeRange === 'daily') {
              return moment(item._id).format('MMMM Do, YYYY');
          } else {
              return moment().month(item._id - 1).format('MMMM');
          }
      });

      const datasets = [{
          label: 'Orders Count',
          data: ordersData.map(item => item.totalOrders)
      }];

      res.json({ labels, datasets });
  } catch (error) {
      console.error('Error fetching orders chart data:', error);
      res.status(500).json({ error: 'Failed to fetch orders chart data' });
  }
}
const getCategoryNameById = async (categoryId) => {
  try {
    const category = await Category.findOne({_id:categoryId})
    console.log(category,"category labels");
    console.log(category.catName,"category name",typeof category.catName);
    return category.catName
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Unknown Category';
  }
};
const productCountChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly'; // Default to monthly if not provided
    let startDate;
    if (timeRange === 'weekly') {
      startDate = moment().startOf('year').toDate()
    } else if (timeRange === 'daily') {
      startDate = moment().subtract(7, 'days').startOf('day').toDate();
    } else {
      startDate = moment().subtract(3, 'months').startOf('month').toDate();
    }

    const productCountData = await Order.aggregate([
      {
        $match: {
          Order_verified: true,
          $or: [
            { Status: "Delivered" },
            { paymentstatus: "paid" }
          ],
          placedon: { $gte: startDate }
        }
      },
      {
        $unwind: "$products" // Split each order into multiple documents, one for each product
      },
      {
        $lookup: {
          from: "products", // Assuming the name of your products collection is "products"
          localField: "products.product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product" // Unwind the product array
      },
      {
        $group: {
          _id: {
            category: "$product.Category", // Assuming category is a field in your products collection
            date: {
              $cond: [
                { $eq: [timeRange, 'weekly'] },
                { $isoWeek: "$placedon" },
                { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$placedon" }, { $month: "$placedon" }] }
              ]
            }
          },
          count: { $sum: "$products.quantity" } // Count the quantity of each product
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Group product counts by date
    const groupedData = _.groupBy(productCountData, '_id.date');

    // Format data for the frontend chart
    const labels = Object.keys(groupedData).map(date => {
      if (timeRange === 'weekly') {
        return `Week ${date}`;
      } else if (timeRange === 'daily') {
        return moment(date).format('MMMM Do, YYYY');
      } else {
        return moment().month(date - 1).format('MMMM');
      }
    });

    // Construct datasets containing the product counts for each category
    const categories = Array.from(new Set(productCountData.map(item => item._id.category))); 
    const categoryNamesPromises = categories.map(category => getCategoryNameById(category));
    const categoryNames = await Promise.all(categoryNamesPromises);

    const datasets = categories.map((category, index) => ({
      label: categoryNames[index],
      data: Object.values(groupedData).map(data => {
        const categoryData = data.find(item => item._id.category === category);
        return categoryData ? categoryData.count : 0;
      })
    }));
    console.log(labels,datasets,"product count based category");
    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching product count chart data:', error);
    res.status(500).json({ error: 'Failed to fetch product count chart data' });
  }
}


const couponpage=async(req,res)=>{
  try{
      res.render("new-coupon")
  }
  catch(error)
  {
      console.log(error.message);
  }
}
const newCoupon = async (req, res) => {
    try {
        const { code, type,limit,expirydate, description, amount,miniamount} = req.body;
    
        // const expirydate=req.body[Expiry-date]
        
        
        console.log('Coupon code:', code);
        console.log('Coupon type:', type);
        console.log('Expiry date: ',expirydate);
        console.log('Description:', description);
        console.log('Amount:', amount);
     
        const coupon=new Coupon({
        Couponcode:code,
        Coupontype:type,
        Usagelimit:limit,
        Expirydate:expirydate,
        Amount:amount,
        Description:description,
        Minimumamount:miniamount
        })
        
        await coupon.save()
        res.redirect('/admin/coupons')
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('An error occurred while creating the coupon.');
    }
}
const Couponlist=async(req,res)=>{
  try{
    const Coupondata=await Coupon.find({})
      res.render("Coupons-list",{Coupons:Coupondata})
  }

catch(error){
  console.log(error.message);
}
}

const coupondelete=async(req,res)=>{
  try{
    const coup=req.query.coupon
    
    const { code, type,limit,expirydate, description, amount,miniamount} = req.body;
    await Coupon.findByIdAndDelete({coup})
  }
  catch(error)
  {
    console.log(error.message);
  }
}

const couponeditpage=async(req,res)=>{
  try{
    const coup=req.query.coupon
    const coupondata=await Coupon.findOne({_id:coup})
    if(!coupondata)
    {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.render('edit-coupon',{Coupons:coupondata})
}
  catch(error) 
  {
    console.log(error.message);
  }
}

const couponupdate=async(req,res)=>{
  try{
    const coup=req.query.id

    const { code, type,limit,expirydate, description, amount,miniamount} = req.body;
    const coupondata=await Coupon.findOneAndUpdate({_id:coup},{$set:{ Couponcode:code,
      Coupontype:type,
      Usagelimit:limit,
      Expirydate:expirydate,
      Amount:amount,
      Description:description,
      Minimumamount:miniamount}})
    if(coupondata)
    {
    res.redirect('/admin/coupons')
}
}
  catch(error)
  {
    console.log(error.message);
  }
}

const downloadpdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    const timeRange = req.query.timeRange; // Get the time range from query parameters

    // Define the filter based on the selected time range
    let filter = {};
    if (timeRange === 'monthly') {
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      filter = {
        $or: [
          { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
         
        ]
      };
    } else if (timeRange === 'yearly') {
      const startOfYear = moment().startOf('year');
      const endOfYear = moment().endOf('year');
      filter = {
        $or: [
          { placedon: { $gte: startOfYear, $lte: endOfYear }, Status: "Delivered" },
         
        ]
      };
    }
    console.log('Filter:', filter)
    const orderdata = await Order.find(
      filter)

  
    const currentdate = new Date()
    const time = currentdate.getTime()
    res.setHeader('Content-Disposition', `attachment; filename="sales_report-${time}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    
    doc.pipe(res);
    
    
    doc.fontSize(12).text(`Sales Report - ${currentdate.toLocaleDateString()}`, { align: 'center' }).moveDown();

    
    const columnWidths = [150, 150, 100, 80, 120, 120, 120]; // Adjust widths as needed

    
    const table = {
      headers: ['Order ID', 'Billing Name', 'Date', 'Total', 'Payment Status', 'Payment Method', 'Order Status'],
      rows: orderdata.map(order => [
        order._id,
        order.Address[0].name,
        order.Date,
        order.Totalprice,
        order.paymentstatus,
        order.payment,
        order.Status
      ])
    };

    doc.table(table, {
      columnSpacing: 10,
      padding: 10,
      columnsSize: [160,80, 80, 80, 80, 80,80],
      align: "center", 
      prepareHeader: () => doc.font('Helvetica-Bold'),
      prepareRow: (row, i) => doc.font('Helvetica').fontSize(10),
    });

    
    doc.end();
  } catch (error) {
    console.log(error.message);
  }
}

const downloadExcel=async(req,res)=>{
  try
  {
    const timeRange = req.query.timeRange; // Get the time range from query parameters

    // Define the filter based on the selected time range
    let filter = {};
    if (timeRange === 'monthly') {
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      filter = {
        $or: [
          { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
         
        ]
      };
    } else if (timeRange === 'yearly') {
      const startOfYear = moment().startOf('year');
      const endOfYear = moment().endOf('year');
      filter = {
        $or: [
          { placedon: { $gte: startOfYear, $lte: endOfYear }, Status: "Delivered" },
          
        ]
      };
    }
    console.log('Filter:', filter)
    const orderdata = await Order.find(
      filter)

  

    const workbook=new exceljs.Workbook()
    const worksheet=workbook.addWorksheet('Sales Report')

    worksheet.addRow(['Order ID','Billing name','Date','Totalprice','Paymentstatus','Payment','Status'])
    orderdata.forEach(order=>{
      worksheet.addRow([
        order._id,
        order.Address[0].name,
        order.Date,
        order.Totalprice,
        order.paymentstatus,
        order.payment,
        order.Status

      ])
    })

    const currentdate=new Date()
    const currenttime=currentdate.getTime()
    res.setHeader('Content-Disposition',`attachment; filename="sales-report-${currenttime}.xlsx"`);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    await workbook.xlsx.write(res)
   res.end()    
  }
  catch(error)
  {
    console.log(error.message);
  }
}
 
const Addproductoffer = async (req, res) => {
  try {
    const productid = req.body.productId;
    const Offer = req.body.offerPercentage;
    console.log(Offer, "offer");
    if (Offer > 90) {
      return res.json({ success: false, message: "Product offer should be applied below 90" });
    }
    const productdata = await product.findOne({ _id: productid });
    const originalprice = productdata.price; // Access original price from productdata
    productdata.offer = parseInt(Offer);
    productdata.originalprice = originalprice; // Save original price
    productdata.price -= Math.floor(productdata.price * (Offer / 100));
    await productdata.save();
    console.log(productdata, "productdata");
    return res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const removeproductoffer = async (req, res) => {
  try {
    const productid = req.body.productId;
    console.log(productid, "id from backend");
    const productdata = await product.findOne({ _id: productid });
    console.log(productdata, "productdata");
    productdata.offer = 0;
    const originalprice = productdata.originalprice; // Access original price from productdata
    productdata.price = originalprice; // Reset price to original
    console.log(productdata.price, "djshfsdjf");
    await productdata.save();
    return res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

    
  

module.exports = {
  loginload,
  // loadLogin,
  verifyLogin,
  loadhomepage,
  logout,
  adminDashboard,
  blockUser,
  unblockUser,
  Addproducts,
  productslist,
  insertproduct,
  loadEditProduct,
  deleteProduct,
  updateProducts,
  securepassword,
  deleteSingleImage,
  Orderlistpage,
  deleteOrder,
  orderdetails,
  ordertracking,
  updateorderstatus,
  salesreport,
  salesmonthly,
  salesyearly,
  salesweekly,
  salesdaily,
  saleschart,
  couponpage,
  Couponlist,
  newCoupon,
  downloadpdf,
  downloadExcel,
  Addproductoffer,
  removeproductoffer,
  coupondelete,
  couponeditpage,
  couponupdate,
  revenueChart,
  productCountChart,
  ordersChart
      
  // toggleUserStatus
}
