const Order=require('../../models/ordermodel')
const Category=require('../../models/categorymodel')
const user = require('../../models/usermodel')
const product = require('../../models/productmodel');
const dayjs=require('dayjs')
const _ = require('lodash');

const moment = require('moment');
const filtersalesreport = async (req, res) => {
  try {
    
    const page = req.query.page || 1;
    
    const ordersperpage = 8;
    const timeRange = req.query.timeRange || 'yearly'; 
    const statusFilter = req.query.status || 'All'; 
    

    
    
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
              dateFilter = {};               break;
              
              default:
              dateFilter = {};
      }

    
      const totalNumberOfOrders = await Order.find({ Order_verified: true, $or: [{ Status: "Delivered" }], ...dateFilter }).countDocuments();
      const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersperpage);
      

      const validpage = Math.max(1, Math.min(page, totalNumberOfPages))
      
      
      


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
    
    const page=req.query.page||1;

    const ordersperpage=8;
    const timeRange = req.query.timeRange || 'all'; 
        const statusFilter = req.query.status || 'All'; 
    

    const totalNumberOfOrders=await Order.find({Order_verified:true,$or: [
      {Status: "Delivered" },
     
  ]}).countDocuments()
    const totalNumberOfPages=Math.ceil(totalNumberOfOrders/ordersperpage)
    
    const userData=await user.findOne({_id:req.session.admin})
    const productdata=await product.find({isVerified:true})
    const catdata=await Category.find({})
    const validpage=Math.min(page,totalNumberOfPages)
    
    const orderdata = await Order.find({
      Order_verified: true,
      $or: [
          { Status: "Delivered" }
      ]
  }).sort({placedon:-1}).skip((validpage - 1) * ordersperpage)
    .limit(ordersperpage);
     

      let orders = orderdata.map(order => {
         let formattedDate = order.Date;;
       
         if (order.Date) {
           const parsedDate = dayjs(order.Date);
           if (parsedDate.isValid()) {
             formattedDate = parsedDate.format('DD/MM/YYYY');
           }
         }
       
         return {
           ...order.toObject(), 
           formattedDate
         };
       });
      
     if(orderdata){
      
      res.render('sales-report', { username: userData.username,totalNumberOfPages,page:validpage,products:productdata,timeRange,statusFilter,
        orders,
        categories:catdata,})
      }
  }
  catch(error){
    console.log(error.message);
  }
}
const salesweekly=async (req, res) => {
  try{
  
  const statusFilter = req.query.status || '';

  const startOfWeek = moment().startOf('week');
  const endOfWeek = moment().endOf('week');


  const weeklyOrders = await Order.find({
    $or: [
      { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" },
     
  ]}).sort({placedon:-1})

   let orders = weeklyOrders.map(order => {
      let formattedDate = order.Date;;
    
      if (order.Date) {
        const parsedDate = dayjs(order.Date);
        if (parsedDate.isValid()) {
          formattedDate = parsedDate.format('DD/MM/YYYY');
        }
      }
    
      return {
        ...order.toObject(), 
        formattedDate
      };
    });
   

       const page = parseInt(req.query.page) || 1;
       const ordersPerPage=8
       const totalNumberOfOrders = await Order.countDocuments({
        $or: [
          { placedon: { $gte: startOfWeek, $lte: endOfWeek }, Status: "Delivered" },
         
      ]});
         const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
         const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
  res.json({orders,totalPages: totalNumberOfPages,
    currentPage: validPage});
}
catch(error)
{
  console.log(error.message);
}}

const salesmonthly=async (req, res) => {
  try{
    
  const statusFilter = req.query.status || '';

  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');

  
  const monthlyOrders = await Order.find({
    $or: [
      { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
     
  ]}).sort({placedon:-1})

  
      const page = parseInt(req.query.page) || 1;
      const ordersPerPage=8
      const totalNumberOfOrders = await Order.countDocuments({
        $or: [
          { placedon: { $gte: startOfMonth, $lte: endOfMonth }, Status: "Delivered" },
         
      ]});
        const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
        const validPage = Math.min(page, Math.max(1, totalNumberOfPages));
         let orders = monthlyOrders.map(order => {
            let formattedDate = order.Date;;
          
            if (order.Date) {
              const parsedDate = dayjs(order.Date);
              if (parsedDate.isValid()) {
                formattedDate = parsedDate.format('DD/MM/YYYY');
              }
            }
          
            return {
              ...order.toObject(), 
              formattedDate
            };
          });
         
  res.json({orders,totalPages: totalNumberOfPages,
    currentPage: validPage});
}
catch(error)
{
  console.log(error.message);
}
}
const salesyearly=async (req, res) => {
  try {
    
  const statusFilter = req.query.status || '';

  const startOfYear = moment().startOf('year');
  const endOfYear = moment().endOf('year');

  
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
     let orders = yearlyOrders.map(order => {
        let formattedDate = order.Date;;
      
        if (order.Date) {
          const parsedDate = dayjs(order.Date);
          if (parsedDate.isValid()) {
            formattedDate = parsedDate.format('DD/MM/YYYY');
          }
        }
      
        return {
          ...order.toObject(), 
          formattedDate
        };
      });
     
  res.json({orders,totalPages: totalNumberOfPages,
    currentPage: validPage});
}
catch(error)
{
  console.log(error.message);
}}

const salesAlltime = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const ordersPerPage = 8;
    const timeRange = req.query.timeRange || 'all';
    const statusFilter = req.query.status || 'All';

    
    let query = { Order_verified: true, Status: "Delivered" };
    if (timeRange !== 'all') {
      const now = dayjs();
      let startDate;
      if (timeRange === 'daily') startDate = now.startOf('day');
      else if (timeRange === 'weekly') startDate = now.startOf('week');
      else if (timeRange === 'monthly') startDate = now.startOf('month');
      else if (timeRange === 'yearly') startDate = now.startOf('year');
      query.Date = { $gte: startDate.toDate() };
    }

    const totalNumberOfOrders = await Order.countDocuments(query);
    const totalNumberOfPages = Math.ceil(totalNumberOfOrders / ordersPerPage);
    const validPage = Math.min(Math.max(1, page), totalNumberOfPages || 1);

    const alltimeOrders = await Order.find(query)
      .sort({ placedon: -1 })
      .skip((validPage - 1) * ordersPerPage)
      .limit(ordersPerPage)
      

         let orders = alltimeOrders.map(order => {
      let formattedDate = order.Date;;
    
      if (order.Date) {
        const parsedDate = dayjs(order.Date);
        if (parsedDate.isValid()) {
          formattedDate = parsedDate.format('DD/MM/YYYY');
        }
      }
    
      return {
        ...order.toObject(), 
        formattedDate
      };
    });
    
    res.json({
      orders,
      totalPages: totalNumberOfPages,
      currentPage: validPage
    });
  } catch (error) {
    console.error('Error in salesAlltime:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const salesdaily=async(req,res)=>{
  try{
    
     
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
     let orders = dailyorders.map(order => {
        let formattedDate = order.Date;;
      
        if (order.Date) {
          const parsedDate = dayjs(order.Date);
          if (parsedDate.isValid()) {
            formattedDate = parsedDate.format('DD/MM/YYYY');
          }
        }
      
        return {
          ...order.toObject(), 
          formattedDate
        };
      });
     
    res.json({orders,totalPages: totalNumberOfPages,
      currentPage: validPage,})
  }catch(error)
  {
    console.log(error.message);
  }
}
const saleschart = async (req, res) => {
  try {

      const timeRange = req.query.timeRange || 'monthly'; 

      let startDate;
      if (timeRange === 'weekly') {
          startDate = moment().startOf('year').toDate();
      } else if (timeRange === 'daily') {
          startDate = moment().subtract(7, 'days').startOf('day').toDate();
      } else {
          startDate = moment().subtract(3, 'months').startOf('month').toDate();
      }


      const salesData = await Order.aggregate([
          {
              $match: {
                  Order_verified: true,
                  $or: [
                      { Status: "Delivered" }
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
                  totalSales: { $sum: 1 } 
              }
          },
          { $sort: { "_id": 1 } } 
      ]);

      
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


      res.json({ labels, datasets });
  } catch (error) {
      console.error('Error fetching sales chart data:', error);
      res.status(500).json({ error: 'Failed to fetch sales chart data' });
  }
}
const revenueChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly'; 
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
          totalRevenue: { $sum: "$Totalprice" }, 
          totalOrders: { $sum: 1 } 
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

    res.json({ labels, datasets });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue chart data' });
  }
}

const ordersChart = async (req, res) => {
  try {
      const timeRange = req.query.timeRange || 'monthly';
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
                  totalOrders: { $sum: 1 } 
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

    return category.catName
  } catch (error) {
    console.error('Error fetching category:', error);
    return 'Unknown Category';
  }
};
const productCountChart = async (req, res) => {
  try {
    const timeRange = req.query.timeRange || 'monthly'; 
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
        $unwind: "$products" 
      },
      {
        $lookup: {
          from: "products", 
          localField: "products.product",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product" 
      },
      {
        $group: {
          _id: {
            category: "$product.Category", 
            date: {
              $cond: [
                { $eq: [timeRange, 'weekly'] },
                { $isoWeek: "$placedon" },
                { $cond: [{ $eq: [timeRange, 'daily'] }, { $dayOfMonth: "$placedon" }, { $month: "$placedon" }] }
              ]
            }
          },
          count: { $sum: "$products.quantity" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
       
    
    const groupedData = _.groupBy(productCountData, '_id.date');


    const labels = Object.keys(groupedData).map(date => {
      if (timeRange === 'weekly') {
        return `Week ${date}`;
      } else if (timeRange === 'daily') {
        return moment(date).format('MMMM Do, YYYY');
      } else {
        return moment().month(date - 1).format('MMMM');
      }
    });


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