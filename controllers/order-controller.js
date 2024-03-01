const Cart = require('../models/Cartmodel');
const Product = require('../models/productmodel');
const Address = require('../models/Addressmodel');
const user=require('../models/usermodel')
const Order=require('../models/ordermodel');
const Razorpay=require("razorpay")
const crypto=require("crypto")
const instance=new Razorpay({
    key_id:"rzp_test_3oY2qxkce538eY",
    key_secret:"7DeliWImbPufhg7KdSXW0cI6",
})

console.log(instance.key_secret,"key_secret");

const orderplaced = async (req, res) => {
    try {
        console.log("hello");
        const userId = req.session.user;
        const paymentOption = req.body.paymentoption;
        console.log("paymentoption", paymentOption);
        const addressId = req.body.addressId;
        console.log("addressid", addressId);
        const totalprice=req.body.subtotal;
        console.log(("Total price",totalprice));

        // Find the user's cart
        // Find the user's cart
const userCart = await Cart.findOne({ user_id: userId });
 const userdata=await user.findOne({_id:userId})
if (userCart) {
    // Calculate total price from cart items
    // const totalprice = userCart.cartItems.reduce((total, item) => {
    //     return total + item.quantity * item.price;
    // }, 0);

    // Extract relevant information from the user's cart
    const products = userCart.cartItems.map(item => ({
        product: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price,
    }));
    for(let i=0;i<products.length;i++)
    {
        console.log("product id", products[i].product)
        const prodid= products[i].product
        const proquanty=products[i].quantity
        const productdata=await Product.findOne({_id:prodid})
              console.log("products data",productdata);
                if(productdata.stock>=proquanty)
                {
                    productdata.stock -=proquanty
                    await productdata.save()
                    console.log("updated product details",productdata);
                }
    }
//    console.log("products data",products);
//    console.log("product id",products.product);
    // Additional information (you may need to adjust based on your requirements)

    const selectedAddressDetails = await Address.findOne({ 'userid': userId, 'Address._id': addressId });

        if (selectedAddressDetails) {
            const selectedAddress = selectedAddressDetails.Address.find(address => address._id.toString() === addressId);
        
            if (selectedAddress) {
    
                const newOrder = new Order({
                    products: products,
                    Totalprice: totalprice,
                    Address: [selectedAddress], // Store only the selected address in an array
                    payment: paymentOption,
                    Status: 'Confirmed',
                    paymentstatus: "Pending",
                    userId: userId,
                    placedon: new Date(),
                    Date: new Date().toLocaleDateString(),
                });            // If paymentOption is true
        // Find the selected address in the array
        if(paymentOption=="COD"){
      
            console.log("orderDetails", newOrder);
                const orderData = await newOrder.save();
                 

                // Clear the user's cart (assuming you want to empty the cart after placing an order)
                userCart.cartItems = [];
                userCart.totalSubtotal = 0;
                await userCart.save();
        
                if (orderData) {
                    const deletecart = await Cart.deleteOne({ user_id: userId })

                    if (deletecart) {
                        res.status(200).json({ success: true,method:"COD", message: 'Order placed successfully' });
                    }
        }}
        else if(paymentOption === "Wallet")
        {
            console.log(userdata.wallet,"walet");
            console.log('total',totalprice)
               if(totalprice>userdata.wallet)
               {
                console.log('entered error wllet')
                 res.json({ jibo:"ben", message: 'Insufficient wallet balance',method:"Wallet" });
               }
               else 
               {
                userdata.wallet-=totalprice
                 
                await userdata.save()
                console.log("orderDetails", newOrder);
                const orderData = await newOrder.save();
                 

                // Clear the user's cart (assuming you want to empty the cart after placing an order)
                userCart.cartItems = [];
                userCart.totalSubtotal = 0;
                await userCart.save();
        
                if (orderData) {
                    const deletecart = await Cart.deleteOne({ user_id: userId })

                    if (deletecart) {
                        res.status(200).json({ success: true,jibo:"glen",method:"Wallet", message: 'Order placed successfully' });
                    }

               }
        }
    }
        else if(paymentOption=="Online")
        {
            
            console.log(process.env.RAZORPAY_ID_KEY,"jumboes");
            console.log(process.env.Razorsecret_key,"juyrew");
            console.log(newOrder._id,"jor");
            console.log(newOrder.Totalprice,"siuy");
            console.log(Order._id,"uhg");
            console.log(Order.Totalprice,"lo",Order.totalprice);
            const generatedOrder = await generateOrderRazorpay(
                newOrder._id,
                newOrder.Totalprice

        )
        console.log("order generate",generatedOrder);
        console.log("orderDetails", newOrder);
        const orderData = await newOrder.save();
         

        // Clear the user's cart (assuming you want to empty the cart after placing an order)
        userCart.cartItems = [];
        userCart.totalSubtotal = 0;
        await userCart.save();

        if (orderData) {
            const deletecart = await Cart.deleteOne({ user_id: userId })

            if (deletecart) {
                res.status(200).json({razorpayorder:generatedOrder ,method:"Online" ,success:true ,razorId:process.env.RAZORPAY_ID_KEY})
                //res.status(200).json({ success: true,method:"Online",razorId:process.env.RAZORPAY_ID_KEY,razorpayorder:generatedOrder,orderid:newOrder._id,amount:newOrder.Totalprice, message: 'Order placed successfully' });
            }
    }
            
                }
             else {
                res.status(400).json({ success: false, message: 'Invalid payment option' });
            }
        }} }else {
            res.status(404).json({ success: false, message: 'User cart not found' });
        }
    } catch (error) {
        console.error('catcherror',error);

        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

const generateOrderRazorpay = (orderId, total) => {
    console.log("order",orderId,"total",total);
    return new Promise((resolve, reject) => {
      const options = {
        amount: total*100,
        currency: "INR",
        receipt: String(orderId),
        
      };console.log(options.receipt,"receipt");
      instance.orders.create(options, (err, order) => {
        console.log("neworder",options);
        console.log("credentials",instance);
        if (err) {
          console.log(err)
          reject(err);
        } else {
            console.log("neworder",order);
          resolve(order);
        }
  });
  });
  };

  const verifypayment=async(req,res)=>{
    try{
   console.log("Req.boyd ==>" , req.body);
   const {orderId,data}=req.body
   const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=data
   const text=`${razorpay_order_id}|${razorpay_payment_id}`
   console.log(text);
   const hmac=crypto.createHmac("sha256",instance.key_secret)
   hmac.update(text)
   const generatedsign=hmac.digest('hex')
   console.log("gen",generatedsign);
   if(generatedsign===razorpay_signature)
   {
    const orderdata=await Order.updateOne({_id:orderId},{$set:{paymentstatus:"paid"}})
    res.status(200).json({success:true,message:"payment verified successfully"})
   }
   else{
    res.status(400).json({success:false,message:"payment verification failed"})
   }
    }
    catch(error){
        console.log(error.message);

    }
  }
module.exports = {
orderplaced,
generateOrderRazorpay,
verifypayment
};
    