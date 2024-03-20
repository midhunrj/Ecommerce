const User = require("../models/usermodel")
const Product = require("../models/productmodel")
const Address = require("../models/Addressmodel")
const Order = require("../models/ordermodel")
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const easyinvoice=require("easyinvoice")

const getprofilepage=async(req,res)=>{
    try{

    const Id=req.session.user

    const userdata=await User.findOne({_id:Id})

    const Addressdata=await Address.findOne({userid:Id})
    
    const Orderdata=await Order.find({userId:Id})
    let count=req.session.count

    res.render('user-profile',{message:'',users:userdata,userAddress:Addressdata,orders:Orderdata,username:userdata.username,count})
}
catch(error)
{
    console.log(error.message)
}}

 const edituserprofile=async(req,res)=>{
    try{
        const Userid=req.query.id
        const data=req.body
        const userdata=await User.updateOne({_id:Userid},
            {$set:{username:data.name,email:data.email,phone:data.mobile}
        })

        res.redirect('/profile')
    }
    catch(error)
{
    console.log(error.message)
}}
const editpassword=async(req,res)=>{
    try{
        const Userid=req.session.user
        const userdata=await User.findOne({_id:Userid})
        if(userdata)
        {
            let count=req.session.count
            res.render("edit-password",{message1:'',message:"",users:userdata,username:userdata.username,count})
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
            if(data.password!==userdata.password)
            {
            res.render("edit-password", {message:'', message1: "Your current password is wrong",users:userdata,count });
            }
            else{
            if (data.newpassword !== data.confirmpassword) {
                res.render("edit-password", {message1:'', message: "Your new and confirm password do not match",users:userdata,count });
            }
            else if (data.newpassword.length<8) {
                res.render("edit-password", {message1:'', message: "Your password is weak it should contain atleast 8 characters",users:userdata,count });
            }  else if(newpassword==confirmpassword) {
                await User.updateOne({ _id: Userid }, { $set: { password: newpassword } });
                res.render("edit-password", { message1:'',message: "Your password has been updated successfully",users:userdata,username:userdata.username,count });
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
        res.render("Add-address",{username:userdata.username})
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
  
  
    res.render('edit-address',{userAddress:Addressdata,username:userdata.username})
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

        
      
          const Addressdata=await Address.findOne({userid:Id})
          const orderData=await Order.findById(orderid)
          const userdata=await User.findById(orderData.userId)
          const Userpro=await User.findOne({_id:Id})
          const productIds = orderData.products.map(product => product.product);
          const productdata = await Product.find({ _id: { $in: productIds } });
          let count=req.session.count
          res.render('user-orderdetails',{users:userdata,username:Userpro.username,orders:orderData,products:productdata,userAddress:Addressdata,count})
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
    
            
            if (newStatus === 'Cancelled' && updatedOrder) {
                if(updatedOrder.payment=="online")
                {
                  userdata.wallet+=updatedOrder.price
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
    
            // Construct the invoice data
    //         const invoiceData = {
    //             documentTitle: 'Order Invoice', // Title of the invoice
    //             currency: 'INR', // Currency of the invoice
    //             taxNotation: 'gst', // Tax notation (can be gst or vat)
    //             tax: 0, // Tax amount (optional)
    //             shipping: 0, // Shipping cost (optional)
    //             items: [
    //                 {
    //                     name:order.Address[0].name,
    //                     quantity: order.products.quantity,
    //                     description: 'Order',
    //                     price: order.Totalprice,
    //                     Paymentmethod: order.paymentstatus,
    //      Status: order.Status,
    // // Total price of the order
                        
    //                 }
    //             ]
    //         };
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
            // custom1: "custom value 1",
            // custom2: "custom value 2",
            // custom3: "custom value 3"
        },
        // Your recipient
        client: {
            company: order.Address[0].name,
            address: order.Address[0].address,
            zip: order.Address[0].pincode,
            city: order.Address[0].city,
            country: order.Address[0].country
            // custom1: "custom value 1",
            // custom2: "custom value 2",
            // custom3: "custom value 3"
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
            // {
            //     quantity: 4.1,
            //     description: "Product 2",
            //     taxRate: 6,
            //     price: 12.34
            // },
            // {
            //     quantity: 4.5678,
            //     description: "Product 3",
            //     taxRate: 21,
            //     price: 6324.453456
            // }
        ],
        // The message you would like to display on the bottom of your invoice
        bottomNotice: "Kindly pay your invoice within 15 days.",
        // Settings to customize your invoice
        settings: {
            currency: "INR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
            // locale: "nl-NL", // Defaults to en-US, used for number formatting (See documentation 'Locales and Currency')        
            // marginTop: 25, // Defaults to '25'
            // marginRight: 25, // Defaults to '25'
            // marginLeft: 25, // Defaults to '25'
            // marginBottom: 25, // Defaults to '25'
            // format: "A4", // Defaults to A4, options: A3, A4, A5, Legal, Letter, Tabloid
            // height: "1000px", // allowed units: mm, cm, in, px
            // width: "500px", // allowed units: mm, cm, in, px
            // orientation: "landscape" // portrait or landscape, defaults to portrait
        },
        // Translate your invoice to your preferred language
        translate: {
            // invoice: "FACTUUR",  // Default to 'INVOICE'
            // number: "Nummer", // Defaults to 'Number'
            // date: "Datum", // Default to 'Date'
            // dueDate: "Verloopdatum", // Defaults to 'Due Date'
            // subtotal: "Subtotaal", // Defaults to 'Subtotal'
            // products: "Producten", // Defaults to 'Products'
            // quantity: "Aantal", // Default to 'Quantity'
            // price: "Prijs", // Defaults to 'Price'
            // productTotal: "Totaal", // Defaults to 'Total'
            // total: "Totaal", // Defaults to 'Total'
            // taxNotation: "btw" // Defaults to 'vat'
        },
    
        // Customize enables you to provide your own templates
        // Please review the documentation for instructions and examples
        // "customize": {
        //      "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
        // }
    };
    
    
            // Generate the invoice PDF
            const pdfBuffer = await easyinvoice.createInvoice(data);
    
            //console.log('PDF Buffer:', pdfBuffer); // Log the PDF buffer
    
            // Set response headers for PDF file
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', `attachment; filename="order-${order._id}-invoice.pdf"`);
    
            // Send the generated PDF file as response
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
         userdata.wallet+=parseInt(amount)
         await userdata.save()
         res.status(200).json({ success:false,message: "Money has been added to wallet successfully",Wallet:userdata.wallet });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
}
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
    Addwallet
}