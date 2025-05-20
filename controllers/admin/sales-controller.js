const Order=require('../../models/ordermodel')
const _ = require('lodash');

const moment = require('moment');
const filtersalesreport = async (req, res) => {
  try {
    console.log(req.query.page);
    const page = req.query.page || 1;
    console.log(page, "pages");
    const ordersperpage = 8;
    const timeRange = req.query.timeRange || 'yearly'; // Default to yearly if not provided
    const statusFilter = req.query.status || 'All'; // Default to All if not provided
    
    console.log("Time Range Filter:", timeRange);
    console.log("Status Filter:", statusFilter);
    
    
    let dateFilter = {};
    const now = moment();
    
    switch (timeRange) {
      case 'daily':
        dateFilter = { placedon: { $gte: now.startOf('day'), $lte: now.endOf('day') } };
        break;
        case 'weekly':
          dateFilter = { placedon: { $gte: now.startOf('week'), $lte: now.endOf('week') } };
          break;
          case 'monthly':
            dateFilter = { placedon: { $gte: now.startOf('month'), $lte: now.endOf('month') } };
            break;
            case 'yearly':
              dateFilter = { placedon: { $gte: now.startOf('year'), $lte: now.endOf('year') } };
              break;
          case 'all':
              dateFilter = {}; // No date filter for all-time
              break;
              default:
              dateFilter = {};
      }

    
      const totalNumberOfOrders = await Order.find({ Order_verified: true, $or: [{ Status: "Delivered" }], ...dateFilter }).countDocuments();
      const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersperpage);
      console.log("totalpage", totalNumberOfPages);

      const validpage = Math.max(1, Math.min(page, totalNumberOfPages));
      
      console.log("valid page", validpage);
      
      // Fetch the order data with the time filter applied
      const orderdata = await Order.find({ Order_verified: true, $or: [{ Status: "Delivered" }], ...dateFilter })
      .sort({ placedon: -1 })
      .skip((validpage - 1) * ordersperpage)
      .limit(ordersperpage);
      
      const userData = await user.findOne({ _id: req.session.admin });
      const productdata = await product.find({ isVerified: true });
      const catdata = await Category.find({});
      
      if (orderdata) {
        res.render('sales-report', { 
          username: userData.username,
          totalNumberOfPages, 
          page: validpage, 
          products: productdata,
          timeRange,
          statusFilter,
          orders: orderdata,
          categories: catdata 
        });
      }
  } catch (error) {
    console.log(error.message);
  }
};

const salesreport=async(req,res)=>{
  try{
    console.log(req.query.page);
    const page=req.query.page||1;
    console.log(page,"pages");
    const ordersperpage=8;
    const timeRange = req.query.timeRange || 'all'; // Default to yearly if not provided
    const statusFilter = req.query.status || 'All'; // Default to All if not provided
    
    console.log("Time Range Filter:", timeRange);
    console.log("Status Filter:", statusFilter);

    const totalNumberOfOrders=await Order.find({Order_verified:true,$or: [
      {Status: "Delivered" },
     
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
     
  ]}).sort({placedon:-1})
       // Modify this to match your schema
       const page = parseInt(req.query.page) || 1;
       const ordersPerPage=8
       const totalNumberOfOrders = await Order.countDocuments({
        $or: [
          { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" },
         
      ]});
         const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
         const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
  res.json({orders:weeklyOrders,totalPages: totalNumberOfPages,
    currentPage: validPage});
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
     
  ]}).sort({placedon:-1})
      // Modify this to match your schema
  
      const page = parseInt(req.query.page) || 1;
      const ordersPerPage=8
      const totalNumberOfOrders = await Order.countDocuments({
        $or: [
          { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
         
      ]});
        const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
        const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
  res.json({orders:monthlyOrders,totalPages: totalNumberOfPages,
    currentPage: validPage});
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
     
  ]}).sort({placedon:-1})

  const page = parseInt(req.query.page) || 1;
  const ordersPerPage=8
  const totalNumberOfOrders = await Order.countDocuments({
    $or: [
      { placedon: { $gte: startOfYear, $lte: endOfYear }, Status: "Delivered" },
     
  ]});
    const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
    const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
  res.json({orders:yearlyOrders,totalPages: totalNumberOfPages,
    currentPage: validPage});
}
catch(error)
{
  console.log(error.message);
}}
const salesAlltime=async (req, res) => {
  try {
    console.log("hello alltime");
  const statusFilter = req.query.status || '';

  
  const alltimeOrders = await Order.find(
      { Status: "Delivered" } 
  ).sort({placedon:-1})
       
  const page = parseInt(req.query.page) || 1;
  const ordersPerPage=8
  const totalNumberOfOrders = await Order.countDocuments({ Status: "Delivered" });
    const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
    const validPage = Math.min(page, Math.max(1, totalNumberOfPages));

  
  res.json({orders:alltimeOrders,totalPages: totalNumberOfPages,
    currentPage: validPage});
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
     
  ]}).sort({placedon:-1})
  const page = parseInt(req.query.page) || 1;
  const ordersPerPage=8
  const totalNumberOfOrders = await Order.countDocuments({$or: [
    { placedon: { $gte: startOfDay, $lte: endOfDay }, Status: "Delivered" }]});
    const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
    const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
    res.json({orders:dailyorders,totalPages: totalNumberOfPages,
      currentPage: validPage,})
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


module.exports={
    salesAlltime,
    saleschart,
    salesdaily,
    salesmonthly,
    salesreport,
    salesweekly,
    salesyearly,
    filtersalesreport,
    revenueChart,
    ordersChart,
    productCountChart,

}