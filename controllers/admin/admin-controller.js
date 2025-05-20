const user = require('../../models/usermodel')
const product = require('../../models/productmodel');
const Category = require('../../models/categorymodel')
const Order=require('../../models/ordermodel')


const _=require("lodash")
const bcrypt = require('bcrypt');
const exceljs=require("exceljs")
const fs=require('fs')
const moment = require('moment');
const path = require('path')
const sharp=require("sharp")
const PDFDocument=require("pdfkit-table")
const { timeStamp } = require('console')
const dayjs=require('dayjs')
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
      .sort({placedon:-1})
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
        let ordersData = orderdata.map(order => {
            let formattedDate = order.Date;;
          
            if (order.Date) {
              const parsedDate = dayjs(order.Date);
              if (parsedDate.isValid()) {
                formattedDate = parsedDate.format('DD/MM/YYYY');
              }
            }
          
            return {
              ...order.toObject(), // ensure it's plain object to avoid Mongoose issues
              formattedDate
            };
          })
   
    const catdata = await Category.find({});

    // Fetch revenue data
    const revenue = await getRevenueData();

    res.render('homesample', {
      username: userData.username,
      orders: ordersData,
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

const updateUserBlockStatus=async(req,res)=>{
  try {
    console.log("juro block/unblcok")
    const {id,block}=req.body
    const userData=await user.findById(id)
    if(block)
    {
      userData.is_blocked=1
    }
    else
    {
      userData.is_blocked=0
    }
    await userData.save()
    res.json({success:true,message:`User ${block ?'blocked':'unblocked'} successfully`})
  } catch (error) {
    console.error('Error updating user block status:',error)
    res.status(500).json({success:false,message:'Internal server error'})
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
      let orders = orderData.map(order => {
          let formattedDate = order.Date;;
        
          if (order.Date) {
            const parsedDate = dayjs(order.Date);
            if (parsedDate.isValid()) {
              formattedDate = parsedDate.format('DD/MM/YYYY');
            }
          }
        
          return {
            ...order.toObject(), // ensure it's plain object to avoid Mongoose issues
            formattedDate
          };
        })
    if (orderData) {
      res.render('Admin-orderlist', {
        orders,
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

          if(updatedOrder.payment=="Online" && updatedOrder.paymentstatus=='paid')
          {
            const User=await user.findById(updatedOrder.userId)

            if(User)
            {
              User.wallet +=updatedOrder.Totalprice

              User.history.push(
                {
                  amount:updatedOrder.Totalprice,
                  status:'Refund',
                  timestamp:new Date()
                }
              )

              await User.save()
            }
          }
          updatedOrder.paymentstatus = 'refunded';
        await updatedOrder.save();
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

const downloadpdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    const timeRange = req.query.timeRange;

    const today=moment().startOf('day')
    let filter = {};
    if (timeRange === 'daily') {
      const endOfDay = moment().endOf('day');
      filter = { placedon: { $gte: today, $lte: endOfDay }, Status: "Delivered" };
    } else if (timeRange === 'weekly') {
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      filter = { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" };
    }
    else if (timeRange === 'monthly') {
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      filter = {
        $or: [
          { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" }
         
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
    else if(timeRange==="all")
    {
      filter={
        Status:"Delivered"
      }
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
    const timeRange = req.query.timeRange; 

    const today=moment().startOf('day')
    let filter = {};
    if (timeRange === 'daily') {
      const endOfDay = moment().endOf('day');
      filter = { placedon: { $gte: today, $lte: endOfDay }, Status: "Delivered" };
    } else if (timeRange === 'weekly') {
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      filter = { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" };
    }
    else if (timeRange === 'monthly') {
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
    else if(timeRange=="all")
    {
      filter={Status:"Delivered"}
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
  updateUserBlockStatus,
  blockUser,
  unblockUser,

  securepassword,
    
  Orderlistpage,
  deleteOrder,
  orderdetails,
  ordertracking,
  updateorderstatus,
  downloadpdf,
  downloadExcel,
  Addproductoffer,
  removeproductoffer,



      
  // toggleUserStatus
}
