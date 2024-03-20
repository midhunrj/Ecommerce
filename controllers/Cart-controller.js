const Cart = require('../models/Cartmodel');
const Product = require('../models/productmodel');
const Address = require('../models/Addressmodel');
const Category=require('../models/categorymodel')
const user=require('../models/usermodel')
const Coupon=require("../models/couponmodel")
const Razorpay=require("razorpay")
const razorypay=new Razorpay({
    key_id:'process.env.RAZORPAY_ID_KEY',
    secret_key:'process.env.Razorsecret_key',
})

const Cartpage=async(req,res)=>{
    try{
        const User=req.session.user
        const cartdata=await Cart.findOne({user_id:User})
        const userdata=await user.findOne({_id:User})
        let count=req.session.count
        if(!cartdata)
        {
            let CartIsEmpty="true"
          return res.status(404).render("cart",{Cart:cartdata,username:userdata.username,count})
        }
       
        const Cartlist=cartdata.cartItems.map(item=>item.product_id)
        
        const Productitems=await Product.find({_id:{$in:Cartlist}})
        // console.log(Productitems,"productitems","categ",Productitems[0].Category);
        // const Categorydata=await Category.findOne({_id:Productitems[0].Category})
        // console.log("categorydata",Categorydata);
        // let befrdisco=Productitems[0].price
        // console.log("cartdata",cartdata);
        // if(Categorydata.offerAmount>0)
        // {
        //    let percentage= Categorydata.offerAmount
        //     Productitems[0].price= Productitems[0].price - Math.floor(Productitems[0].price * (percentage/ 100) )
        //     console.log("product after category discount",Productitems[0].price);
        //     cartdata.cartItems.price=Productitems[0].price
        //     //await Product.save()
        // }
        // else{
        //   Productitems[0].price=befrdisco
        // //    await Product.save()
        // }
        const cartItems=cartdata.cartItems
     return res.render('Cart',{products:Productitems,Cart:cartdata,cartdata:cartItems,username:userdata.username,count})
      }
    
    catch (error) {
      console.log(error.message);
  }
  }
  const Checkoutpage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userdata=await user.findOne({_id:userId})
        // Aggregation pipeline to fetch cart data with product details
        let count=req.session.count
        const cartAggregate = await Cart.aggregate([
            { $match: { user_id: userId } },
            { $unwind: "$cartItems" }, // Unwind to deconstruct cartItems array
            {
                $lookup: {
                    from: "products", // Assuming the name of your product model collection
                    localField: "cartItems.product_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" }, // Unwind to deconstruct product array
            {
                $group: {
                    _id: "$_id", // Group by cart ID
                    cartItems: { $push: "$cartItems" }, // Reconstruct cartItems array
                    products: { $push: "$product" } // Reconstruct products array
                }
            }
        ]);

        // Extract required data from the aggregation result
        const cartData = cartAggregate[0]; // Assuming there's only one cart per user
        if (!cartData) {
            // Handle the case where the cart is not found for the user
            return res.status(404).render('Check-out', {username:userdata.username,count});
        }
        const products = cartData.products;
        const cartItems = cartData.cartItems;
        const Coupondata=await Coupon.find({})

        // Fetch user address data
        const addressData = await Address.findOne({ userid: userId });

        // Render the checkout page with fetched data
        res.render('Check-out', { products, Cart: cartData, cartdata: cartItems, userAddress: addressData,username:userdata.username,Coupons:Coupondata,count });

    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;
        console.log("hello",productId);

        // Find the user's cart
        let cartData = await Cart.findOne({ user_id: userId });

        // Find the product data
        const productData = await Product.findOne({ _id: productId });
        console.log("pro-price",productData.price)

        if (!productData) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
      console.log("products stock",productData.stock);
        // Check if product is in stock
        


        // Check if the user has a cart
        if (cartData) {
            // Check if the product is already in the cart
            const cartItem = cartData.cartItems.find(item => item.product_id == productId);
           // console.log(cartData.cartItems[0].quantity,"cartitem");
            
            if (cartItem) {
                if (productData.stock < 1||cartItem.quantity+1>productData.stock) {
                    return res.status(200).json({ success: false, message: 'Product is out of stock' });
                }    
                // Update the quantity and calculate subtotal
                cartItem.quantity += 1;
                const subtotal = cartItem.quantity * cartItem.price;
                cartItem.subtotal = subtotal;
            } else {
                // Add a new item to cartItems
                if (productData.stock < 1) {
                    return res.status(200).json({ success: false, message: 'Product is out of stock' });
               }
                const newItem = {
                    product_id: productId,
                    quantity: 1,
                    price: productData.price,
                    Totalstock:productData.stock
                };
                newItem.subtotal = newItem.quantity * newItem.price;
                cartData.cartItems.push(newItem);
            }

            // Calculate the total subtotal for all items in the cart
            const totalSubtotal = cartData.cartItems.reduce((total, item) => total + item.subtotal, 0);

            // Update the total subtotal in the cart
            cartData.totalSubtotal = totalSubtotal;

            // Save the updated cart data
            await cartData.save();
            res.status(200).json({success:true, message: 'Product added to cart successfully' });
        } else {
            // If the user doesn't have a cart, create a new one
            const newCart = new Cart({
                user_id: userId,
                cartItems: [{
                    product_id: productId,
                    quantity: 1,
                    price: productData.price,
                    Totalstock:productData.stock
                }],
                totalSubtotal: productData.price // Initial total subtotal
            });
            console.log("productdata stock",productData.stock);
            
            // Save the new cart data
            {
            await newCart.save();
            res.status(200).json({ success:true,message: 'Product added to cart successfully' });
            }   
        }

        
    } catch (error) {
        console.error(error);
        res.status(500).json({success:false, error: 'Internal Server Error' });
    }
};
// const Cart = require('../path-to-your-updated-cart-model');

const updateQuantity = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;
        const count = req.body.count;
        console.log("productId", productId, "\nuserId", userId, "count", count);

        const userCart = await Cart.findOne({ user_id: userId });

        if (userCart) {
            const productInCart = userCart.cartItems.find(item => item.product_id.toString() === productId);
              console.log(productInCart.quantity);
            if (productInCart) {
                let newQuantity;
                console.log("newQuantity", newQuantity);
                if (count == 1) {
                    newQuantity = productInCart.quantity + 1;
                } else if (count == -1) {
                    newQuantity = productInCart.quantity - 1;
                    
                } else {
                    return res.status(400).json({ status: false, error: "Invalid count" });
                }
                console.log("newQuantity", newQuantity);
                if(newQuantity==0)
                    {
                        const updatedCart = await Cart.findOneAndUpdate(
                            { user_id: userId },
                            {
                                $pull: {
                                    cartItems: { product_id: productId }
                                }
                            },
                            { new: true }
                        );
                        await updatedCart.save()
                        if(updatedCart.cartItems.length==0)
        {
            await Cart.deleteOne({user_id:userId})
        }
                    }
                console.log("productInCart.quantity", productInCart,productInCart.quantity);

                if (newQuantity > 0 && newQuantity <= productInCart.Totalstock) {
                    // Update the quantity in the array
                    productInCart.quantity = newQuantity;
                      
                    // Save the updated userCart to MongoDB
                    await userCart.save();

                    const totalSubtotal = productInCart.price * newQuantity;

                    console.log("totalSubtotal", totalSubtotal);
                    let TotPrice=0
                    await Cart.find({user_id:userId}).then((data)=>{
                        console.log(data,"dataa");
                        console.log(data[0].cartItems,"itema");
                        for(i=0;i<data[0].cartItems.length;i++){
                            TotPrice+=data[0].cartItems[i].quantity*data[0].cartItems[i].price
                            if(TotPrice<=0)
                            {
                                TotPrice=0
                            }
                        }
                    })
                    console.log(TotPrice,"TOTPRICE");

                    // Return the updated quantity and totalAmount to the frontend
                    return res.json({ status: true, quantityInput: newQuantity, count: count, tot:TotPrice, totalAmount:totalSubtotal });
                } else {
                    return res.json({ status: false, error: 'Out of stock or invalid quantity' });
                }
            } else {
                return res.json({ status: false, error: 'Product not found in cart' });
            }
        } else {
            return res.json({ status: false, error: 'User cart not found' });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ status: false, error: "Server error" });
    }
};

const mongoose = require('mongoose');

const DeleteCart = async (req, res) => {
    try {
        const cartId = req.query.id;
        const userId = req.session.user;

        // Validate if cartId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(cartId)) {
            return res.status(400).json({ error: 'Invalid cart ID' });
        }

        const updatedCart = await Cart.findOneAndUpdate(
            { user_id: userId },
            {
                $pull: {
                    cartItems: { product_id: cartId }
                }
            },
            { new: true }
        );
        if(updatedCart.cartItems.length==0)
        {
            await Cart.deleteOne({user_id:userId})
        }
        res.status(200).json({ success: true, message: 'Item removed from cart', });
        if(updatedCart&updatedCart.cartItems.length==0)
        {
            let CartIsEmpty="true"
            res.render('Cart',{CartIsEmpty})
        }
        // res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        // Handle the error and send an appropriate response
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports={
  Cartpage,
  addToCart,
  Checkoutpage,
  DeleteCart,
  updateQuantity
}