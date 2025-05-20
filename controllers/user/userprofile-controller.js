const User = require("../../models/usermodel")
const Product = require("../../models/productmodel")
const Address = require("../../models/Addressmodel")
const Order = require("../../models/ordermodel")
const Cart=require('../../models/Cartmodel')
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const easyinvoice=require("easyinvoice")
const Razorpay=require("razorpay")
const crypto=require("crypto")
const dayjs=require('dayjs')

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.Razorsecret_key
});
const getprofilepage=async(req,res)=>{
    try{

    const Id=req.session.user

    const userdata=await User.findOne({_id:Id})

    const Addressdata=await Address.findOne({userid:Id})
    
    const page = req.query.page || 1; 
    const limit = 6; 
    const skip = (page - 1) * limit; 
    
    
    const Orderdata = await Order.find({ userId: Id }).sort({placedon:-1}).skip(skip).limit(limit);

 
    const totalCount = await Order.countDocuments({ userId: Id });
    const cartData=await Cart.aggregate([{$match:{user_id:req.session.user}},{$unwind:"$cartItems"},{$group:{_id:null,count:{"$sum":"$cartItems.quantity"}}}])
  console.log(cartData[0]?.count);
  
  if(cartData.length>0)
  {
     count=cartData[0].count
     console.log(count,'countcart')
  }
  else
  {
    count=0
  }
  req.session.count=count
  let orders = Orderdata.map(order => {
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
  });
  
    let wishcount=req.session.wishcount
    res.render('user-profile',{message:'',users:userdata,userAddress:Addressdata,orders,username:userdata.username,count,wishcount,currentPage: page,referalCode: userdata.referalCode||'n/a',search:req.query.search ,// Pass current page to frontend for highlighting active page in pagination
    totalPages: Math.ceil(totalCount / limit)})
}
catch(error)
{
    console.log(error.message)
}}

const edituserprofile = async (req, res) => {
    try {

        const userId = req.query.id;
console.log(req.body,"user profile update",req.file)

        
        const { name, email, mobile } = req.body;


        const croppedProfileImageData = req.file;
        console.log("=====>",croppedProfileImageData)

        
        await User.findByIdAndUpdate(userId, {
            username: name,
            email: email,
            phone: mobile,

            ...(croppedProfileImageData && { profilePicture: croppedProfileImageData.filename })
        });

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};
const editpassword=async(req,res)=>{
    try{
        const Userid=req.session.user
        const userdata=await User.findOne({_id:Userid})
        if(userdata)
        {
            let count=req.session.count
            let wishcount=req.session.wishcount
            res.render("edit-password",{message1:'',message:"",users:userdata,username:userdata.username,count,wishcount})
        }
        console.log("user id",userdata._id);
    }
    catch(error)
    {
        console.log(error.message)
    }
}
const changepassword = async (req, res) => {
    try {
        const Userid = req.query.id;
        console.log("change pswd user id",Userid);
        const data = req.body;
        const newpassword=await bcrypt.hash(data.newpassword,10)
        const confirmpassword=newpassword
        let count=req.session.count
        const userdata = await User.findOne({_id:Userid});
   console.log("userdata",userdata);
       console.log(data,"passwords");
       let wishcount=req.session.wishcount
            if(data.password!==userdata.password)
            {
            res.render("edit-password", {message:'', message1: "Your current password is wrong",users:userdata,count,wishcount });
            }
            else{
            if (data.newpassword !== data.confirmpassword) {
                res.render("edit-password", {message1:'', message: "Your new and confirm password do not match",users:userdata,count,wishcount });
            }
            else if (data.newpassword.length<8) {
                res.render("edit-password", {message1:'', message: "Your password is weak it should contain atleast 8 characters",users:userdata,count,wishcount });
            }  else if(newpassword==confirmpassword) {
                await User.updateOne({ _id: Userid }, { $set: { password: newpassword } });
                res.render("edit-password", { message1:'',message: "Your password has been updated successfully",users:userdata,username:userdata.username,count,wishcount });
            }
            }
    } catch (error) {
        console.log(error.message);
    }
};

    
const getaddress=async(req,res)=>{
    try{
        const user=req.session.user
        const userdata=await User.findOne({_id:user})
        let wishcount=req.session.wishcount
        let count=req.session.count
        res.render("Add-address",{username:userdata.username,count,wishcount,search:req.query.search})
    }

catch(error)
{
    console.log(error.message)
}}
 

const NewAddress=async(req,res)=>{
    try{
        const UserId=req.session.user
    
        const userdata=await User.findOne({_id:UserId})
        const {
            name,
            address,
            landmark,
            city,
            state,
            phone,
            altphone,
            pincode,
        country}=req.body
    const userAddress=await Address.findOne({userid:userdata._id})
      if(!userAddress)
      {
        const adres=new Address({
            userid:userdata._id,
            Address:[
          { name,
           address,
           landmark,
           city,
           state,
           phone,
           altphone,
           pincode,
           country
        
      }]})
        await adres.save()
    }
    else
    {
        userAddress.Address.push({
            name,
            address,
            landmark,
            city,
            state,
            phone,
            altphone,
            pincode,
            country  
        })
       await userAddress.save()
    }
    res.redirect('/profile#address')
}
    catch(error)
    {
        console.log(error.message)
    }
}
const editaddress=async(req,res)=>{
   try{
    const addressId=req.query.id
    const UserId=req.session.user
    console.log("hl",addressId);
    const Addressdata = await Address.findOne(
        { 'Address._id': addressId },
        { 'Address.$': 1 }
      );
    const userdata=await User.findOne({_id:UserId})
    console.log("this is ",Addressdata)
    let wishcount=req.session.wishcount
    let count=req.session.count
    res.render('edit-address',{userAddress:Addressdata,username:userdata.username,count,wishcount})
}
// else{
//     console.log(error.message)
// }
   
catch(error)
{
    console.log(error.message)
}
}
 const updateaddress = async (req, res) => {
        try {
            const addressid = req.query.id;
            console.log("query is", addressid);
    
         const Addressdata = await Address.findOneAndUpdate(
            { 'Address._id': addressid },
             {
                 $set: {
                        'Address.$.name': req.body.name,
                        'Address.$.address': req.body.Address,
                        'Address.$.landmark': req.body.landmark,
                        'Address.$.city': req.body.city,
                        'Address.$.state': req.body.state,
                        'Address.$.country': req.body.country,
                        'Address.$.pincode': req.body.pincode,
                        'Address.$.Phone': req.body.phone,
                        'Address.$.altphone': req.body.altphone,
                    },
                },
                { new: true }
            );
    
            console.log("Updated Address data:", Addressdata);
    
            res.redirect('/profile#address');
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Internal Server Error");
        }
    };
    
    const deleteaddress = async (req, res) => {
        try {
          console.log("entering ")
          const addressid = req.query.id;
          console.log("this is id",addressid);
          
         const findAddress= await Address.findOne({ 'Address._id': addressid })
         console.log("my deleting address",findAddress);
         await Address.updateOne({ 'Address._id': addressid },
          {
            $pull:{
               'Address':{
                _id:addressid 
            }
          }
        });
          console.log("deleting address",findAddress);
          res.redirect("/profile");
        } catch (error) {
          console.error("Error in deleteCategory:", error.message);
          res.status(500).send("Internal Server Error");
        }
      };
      const orderdetails=async(req,res)=>{
        try
        {
          const orderid=req.query.id
          const Id=req.session.user

          let wishcount=req.session.wishcount
      
          const Addressdata=await Address.findOne({userid:Id})
          const orderData=await Order.findById(orderid)
          const userdata=await User.findById(orderData.userId)
          const Userpro=await User.findOne({_id:Id})
          const productIds = orderData.products.map(product => product.product);
          const productdata = await Product.find({ _id: { $in: productIds } });
          let count=req.session.count
          res.render('user-orderdetails',{users:userdata,username:Userpro.username,orders:orderData,products:productdata,userAddress:Addressdata,count,wishcount})
          console.log("productdata",productdata);
          
        }
        catch (error) {
          console.log(error.message);
        }
      }
      const ordertracking=async(req,res)=>{
        try{
          const orderid=req.query.id
         const user=req.session.user
          const orderData=await Order.findById(orderid)
          const userdata=await User.findById(orderData.userId)
          const Userpro=await User.findOne({_id:user})
          let count=req.session.count
          res.render('user-ordertracking',{users:userdata,username:Userpro.username,orders:orderData,count})
        }
        catch (error) {
          console.log(error.message);
        }
      }
      const updateorderstatus = async (req, res) => {
        try {
            const { orderID, newStatus } = req.body;
            const Userid=req.session.user
            console.log("orderID", orderID, "\n newStatus", newStatus);
    
            const userdata=await User.findOne({_id:Userid})
            const updatedOrder = await Order.findOneAndUpdate({ _id: orderID }, { Status: newStatus }, { new: true });
    
            
            if (newStatus === 'Cancelled') {
                if(updatedOrder.payment=="Online"||updatedOrder.payment=="Wallet")
                {
                    console.log("hello it is userdata from refunding",userdata);

                    console.log("hello it is updatedorder data from refunding",updatedOrder);
                    
                  userdata.wallet+=updatedOrder.Totalprice
                  updatedOrder.paymentstatus="refunded"

                  userdata.history.push({
                    amount:updatedOrder.Totalprice,
                    status:"Credit",
                    message:"Refunded from cancelled order",
                    timestamp:new Date()

                  })
                  updatedOrder.save()
                  userdata.save()

                  
                }
                await Order.findOneAndUpdate({_id:orderID},{$set:{Order_verified:false}})

                for (const productItem of updatedOrder.products) {
                    const productId = productItem.product;
                    const quantity = productItem.quantity;
                    console.log("updatedorder",updatedOrder);
    
                    
                    const product = await Product.findById(productId);
                  console.log("products restroe time aagaya",product);
                    
                    if (product) {
                        product.stock += quantity; 
                        await product.save();
                        console.log("products after restoring\n ratatata !!!! ratattaaatata",product);
                    }
                }
            }
    
            
            res.status(200).json({ success: true, updatedOrder });
        } catch (error) {
            console.error('Error updating order status:', error);
            res.status(500).json({ error: 'Error updating order status' });
        }
    }
    const orderinfo = async (req, res) => {
        try {
            const orderId = req.params.orderId;
            // Query the database for the specific order
            const order = await Order.findById(orderId).populate('products.product');
    console.log("download",order);
    console.log("order produt",order.products[0].product);
            if (!order) {
                return res.status(404).send('Order not found');
            }
    
    var data = {
        apiKey: "free", // Please register to receive a production apiKey: https://app.budgetinvoice.com/register
        mode: "development", // Production or development, defaults to production   
        images: {
            // The logo on top of your invoice
            logo: "https://public.budgetinvoice.com/img/logo_en_original.png",
            // The invoice background
            background: "https://public.budgetinvoice.com/img/watermark-draft.jpg"
        },
        // Your own data
        sender: {
            company: "Sample Corp",
            address: "Sample Street 123",
            zip: "1234 AB",
            city: "Sampletown",
            country: "Samplecountry"
                    },
        // Your recipient
        client: {
            company: order.Address[0].name,
            address: order.Address[0].address,
            zip: order.Address[0].pincode,
            city: order.Address[0].city,
            country: order.Address[0].country
           
        },
        information: {
            // Invoice number
            number: order._id,
            // Invoice data
            date: order.Date,
            // Invoice due date
            dueDate: order.Date+7
        },
        // The products you would like to see on your invoice
        // Total values are being calculated automatically
        products: [
            {
                quantity: order.quantity,
                description:order.products[0].product[0].productname,
                price: order.products[0].price,
                Totalprice:order.products.Totalprice
            },
            
        ],
        // The message you would like to display on the bottom of your invoice
        bottomNotice: "Kindly pay your invoice within 15 days.",
        // Settings to customize your invoice
        settings: {
            currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
                 
        },
        // Translate your invoice to your preferred language
        translate: {
           
        },
    

    };
    
    
            // Generate the invoice PDF
            const pdfBuffer = await easyinvoice.createInvoice(data);
    
                        res.status(200).json(pdfBuffer);
        } 
        catch (error) {
            console.error('Error generating invoice:', error);
            res.status(500).send('Internal Server Error');
        }
    };
    const Addwallet=async(req,res)=>{
        try{
        const amount=req.body.amount;
        console.log("amount to add wallet",amount);
        const user=req.session.user;
        const userdata=await User.findOne({_id:user})
        if(!userdata){
            return res.status(400).json({success:false,message:"failed to add money"})
        }
        const generatedOrder = await generateOrderRazorpay(amount);
        // userdata.wallet+=parseInt(amount)
         
         res.status(200).json({ success:true,message: "Money has been added to wallet successfully",Wallet:userdata.wallet,razorpayOrder: generatedOrder,amount, razorId: process.env.RAZORPAY_ID_KEY  });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const generateOrderRazorpay = (amount) => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: amount*100, 
            currency: "INR",
            receipt: `wallet_recharge_${Date.now()}`, 
            payment_capture: 1 
        };

        instance.orders.create(options, (err, order) => {
            if (err) {
                reject(err);
            } else {
                resolve(order);
            }
        });
    });
};

const verifyPayment = async (req, res) => {
    try {
        console.log("Req.body ==>", req.body);
        const { orderId, data } = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        console.log(text);
        
        const hmac = crypto.createHmac("sha256", instance.key_secret);
        hmac.update(text);
        const generatedSignature = hmac.digest('hex');
        console.log("Generated Signature:", generatedSignature);
        
        if (generatedSignature === razorpay_signature) {

            const user = await User.findById(req.session.user);
            const amount = parseInt(req.body.amount); 
            user.wallet += amount; 
            user.history.push({
                amount:amount,
                status:"Credit",
                message:"Added money to wallet",
                timestamp:new Date()
    
              })
            // await userdata.save()
            await user.save();

            res.status(200).json({ success: true, message: "Payment verified and wallet updated successfully",amount });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};

module.exports={
    NewAddress,
    getprofilepage,
    edituserprofile,
    editpassword,
    changepassword,
    getaddress,
    editaddress,
    updateaddress,
    deleteaddress,
    orderdetails,
    ordertracking,
    updateorderstatus,
    orderinfo,
    Addwallet,
    verifyPayment,
generateOrderRazorpay
}
