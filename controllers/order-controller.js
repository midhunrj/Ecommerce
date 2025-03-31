const Cart = require('../models/Cartmodel');
const Product = require('../models/productmodel');
const Address = require('../models/Addressmodel');
const user=require('../models/usermodel')
const Order=require('../models/ordermodel');
const Razorpay=require("razorpay")
const crypto=require("crypto")
const instance=new Razorpay({
    key_id:process.env.RAZORPAY_ID_KEY,
    key_secret:process.env.Razorsecret_key
})

console.log(instance.key_secret,"key_secret");

const orderplaced = async (req, res) => {
    try {
        console.log("hello");
        const userId = req.session.user;
        const coupon=req.body.coupon
        console.log(coupon,"coupon");
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

    // Additional information (you may need to adjust based on your requirements)

    const selectedAddressDetails = await Address.findOne({ 'userid': userId, 'Address._id': addressId });

        if (selectedAddressDetails) {
            const selectedAddress = selectedAddressDetails.Address.find(address => address._id.toString() === addressId);
            
            if (selectedAddress) {
                if(req.session.coupon)
                {
                const couponUsage = userdata.coupons.find(c => c.couponCode === coupon);
                if (!couponUsage) {
                    // If the user hasn't used the coupon before, create a new entry
                    
                    userdata.coupons.push({ couponCode: coupon, usageCount: 1 });
                  } else {
                    // If the user has used the coupon before, increment the usage count
                  couponUsage.usageCount++;
                  }
                
                  // Save the changes to the user document
                  await userdata.save();
                }
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
                userdata.history.push({
                    amount:totalprice,
                    status:"Debit",
                    message:"placed order from wallet",
                    timestamp:new Date()

                  })
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
   if (generatedsign === razorpay_signature) {
    // Payment verification successful
    await Order.updateOne({ _id: orderId }, { $set: { paymentstatus: "Paid" } });
    res.status(200).json({ success: true, message: "Payment verified successfully" });
} else {
    // Payment verification failed
    await Order.updateOne({ _id: orderId }, { $set: { paymentstatus: "Failed" } });
    res.status(400).json({ success: false, message: "Payment verification failed" });
}
    }
    catch(error){
        console.log(error.message);

    }
  }
//   const retryPayment = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         console.log("Retrying payment for order:", orderId);

//         const order = await Order.findById(orderId);

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.paymentstatus !== "Failed") {
//             return res.status(400).json({ success: false, message: "Payment is already completed or not failed." });
//         }

//         if (!order.Totalprice || order.Totalprice <= 0) {
//             return res.status(400).json({ success: false, message: "Invalid total price for order." });
//         }

//         // Creating a new Razorpay order for retrying payment
//         const options = {
//             amount: order.Totalprice * 100, // Amount in paisa (1 INR = 100 paisa)
//             currency: "INR",
//             receipt: `retry_receipt_${orderId}`,
//             payment_capture: 1, // Automatically capture the payment
//         };

//         console.log("Creating Razorpay order with options:", options);

//         instance.orders.create(options, (err, razorpayOrder) => {
//             if (err) {
//                 console.error("Error creating Razorpay order:", err);
//                 return res.status(500).json({ success: false, message: "Failed to create Razorpay order." });
//             }

//             console.log("New Razorpay order created:", razorpayOrder);

//             res.json({ 
//                 success: true, 
//                 amount: order.Totalprice, 
//                 razorpayOrderId: razorpayOrder.id,
//                 razorpayKey: process.env.RAZORPAY_ID_KEY // Sending Razorpay Key for frontend
//             });
//         });

//     } catch (error) {
//         console.error("Retry Payment Error:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };

const retryPayment = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log("Retrying payment for order:", orderId);

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.paymentstatus !== "Failed") {
            return res.status(400).json({ success: false, message: "Payment is already completed or not failed." });
        }

        if (!order.Totalprice || order.Totalprice <= 0) {
            return res.status(400).json({ success: false, message: "Invalid total price for order." });
        }

        // Creating a new Razorpay order for retrying payment
        const options = {
            amount: order.Totalprice * 100, // Amount in paisa (1 INR = 100 paisa)
            currency: "INR",
            receipt: `retry_receipt_${orderId}`,
            payment_capture: 1, // Automatically capture the payment
        };

        console.log("Creating Razorpay order with options:", options);

        instance.orders.create(options, (err, razorpayOrder) => {
            if (err) {
                console.error("Error creating Razorpay order:", err);
                return res.status(500).json({ success: false, message: "Failed to create Razorpay order." });
            }

            console.log("New Razorpay order created:", razorpayOrder);

            res.json({ 
                success: true, 
                amount: order.Totalprice, 
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: process.env.RAZORPAY_ID_KEY, // Sending Razorpay Key for frontend
                orderId: order._id // Sending actual order ID for verification
            });
        });

    } catch (error) {
        console.error("Retry Payment Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// const retryPayment = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;
//         const order = await Order.findById(orderId);

//         if (!order) {
//             console.log("jonk");
            
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (order.paymentstatus !== "Failed") {
//             console.log("jerki");
            
//             return res.status(400).json({ success: false, message: "Payment is already completed or not failed." });
//         }
// console.log("sfnsns",orderId);

//         // Create a new Razorpay order
//         const razorpayOrder = await instance.orders.create({
//             amount: order.Totalprice * 100, // Amount in paise
//             currency: "INR",
//             receipt: `receipt_${orderId}`,
//             payment_capture: 1, // Auto-capture payment
//         });

//         console.log(razorpayOrder,"nsnkl");
        

//         res.json({ 
//             success: true, 
//             amount: order.Totalprice, 
//             razorpayOrderId: razorpayOrder.id 
//         });
//     } catch (error) {
//         console.error("Retry Payment Error:", error);
//         res.status(500).json({ success: false, message: "Internal Server Error" });
//     }
// };
module.exports = {
orderplaced,
generateOrderRazorpay,
verifypayment,
retryPayment
};


// const verifypayment = async (req, res) => {
//     try {
//         console.log("Req.body ==>", req.body);

//         const { orderId, data } = req.body;

//         // Check if payment failed
//         if (data.error) {
//             console.log("Payment failed:", data.error);
//             await Order.updateOne({ razorpayOrderId: orderId }, { $set: { paymentstatus: "Failed" } });
//             return res.status(400).json({ success: false, message: "Payment failed", error: data.error });
//         }

//         // Extract required fields
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

//         if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//             return res.status(400).json({ success: false, message: "Invalid payment data" });
//         }

//         // Generate HMAC signature for verification
//         const text = `${razorpay_order_id}|${razorpay_payment_id}`;
//         console.log("Verification text:", text);

//         const hmac = crypto.createHmac("sha256", instance.key_secret);
//         hmac.update(text);
//         const generatedsign = hmac.digest("hex");

//         console.log("Generated HMAC:", generatedsign);

//         if (generatedsign === razorpay_signature) {
//             // Payment verification successful
//             await Order.updateOne({ razorpayOrderId: orderId }, { $set: { paymentstatus: "Paid" } });
//             return res.status(200).json({ success: true, message: "Payment verified successfully" });
//         } else {
//             // Payment verification failed
//             await Order.updateOne({ razorpayOrderId: orderId }, { $set: { paymentstatus: "Failed" } });
//             return res.status(400).json({ success: false, message: "Payment verification failed" });
//         }
//     } catch (error) {
//         console.error("Error in payment verification:", error.message);
//         res.status(500).json({ success: false, message: "Server error", error: error.message });
//     }
// };

// const verifypayment = async (req, res) => {
//     try {
//         console.log("Req.body ==>", req.body);

//         const { orderId, data } = req.body;

//         // 🔴 Payment failed case
//         if (data.error) {
//             console.log("Payment failed:", data.error);

//             // Update payment status to "Failed"
//             const updateResult = await Order.updateOne({ orderId: orderId }, { $set: { paymentstatus: "Failed" } });

//             if (updateResult.modifiedCount === 0) {
//                 console.error("⚠️ No document updated. Check if orderId exists in the database.");
//                 return res.status(400).json({ success: false, message: "Order not found or already updated" });
//             }

//             return res.status(400).json({ success: false, message: "Payment failed", error: data.error });
//         }

//         // 🔵 Extract required fields for successful payment
//         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

//         if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//             return res.status(400).json({ success: false, message: "Invalid payment data" });
//         }

//         // 🔐 Generate HMAC signature for verification
//         const text = `${razorpay_order_id}|${razorpay_payment_id}`;
//         console.log("Verification text:", text);

//         const hmac = crypto.createHmac("sha256", instance.key_secret);
//         hmac.update(text);
//         const generatedsign = hmac.digest("hex");

//         console.log("Generated HMAC:", generatedsign);

//         if (generatedsign === razorpay_signature) {
//             // ✅ Payment verification successful
//             const updateResult = await Order.updateOne({ orderId: orderId }, { $set: { paymentstatus: "Paid" } });

//             if (updateResult.modifiedCount === 0) {
//                 console.error("⚠️ No document updated. Check if orderId exists in the database.");
//                 return res.status(400).json({ success: false, message: "Order not found or already updated" });
//             }

//             return res.status(200).json({ success: true, message: "Payment verified successfully" });
//         } else {
//             // ❌ Payment verification failed
//             await Order.updateOne({ orderId: orderId }, { $set: { paymentstatus: "Failed" } });
//             return res.status(400).json({ success: false, message: "Payment verification failed" });
//         }
//     } catch (error) {
//         console.error("❌ Error in payment verification:", error.message);
//         res.status(500).json({ success: false, message: "Server error", error: error.message });
//     }
// }

// const retryPayment=async(req,res)=>{
//   try {
//     const orderId = req.params.orderId;
//     const order = await Order.findById(orderId);

//     if (!order) {
//         return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.paymentstatus !== "Failed") {
//         return res.status(400).json({ success: false, message: "Payment is already completed or not failed." });
//     }

//     // Example: Call a payment service to retry payment
//     const paymentResponse = await initiatePayment(order);

//     if (paymentResponse.success) {
//         res.json({ success: true, redirectUrl: paymentResponse.paymentUrl });
//     } else {
//         res.json({ success: false, message: "Failed to initiate payment retry." });
//     }
// } catch (error) {
//     console.error("Retry Payment Error:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
// }
// }
      
