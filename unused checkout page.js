const Checkoutpage = async (req, res) => {
    try {
        const User = req.session.user;

        const addressdata = await Address.findOne({ userid: User });
        const cartdata = await Cart.findOne({ user_id: User });
console.log("cartdata",cartdata);
const userdata=await user.findOne({_id:User})
        if (!cartdata) {
            // Handle the case where the cart is not found for the user
            return res.status(404).render('Check-out', {username:userdata.username});
        }
      
        const cartItems = cartdata.cartItems;
        const cartlist = cartItems.map(item => item.product_id);
        const productitems = await Product.find({ _id: { $in: cartlist } });
        console.log(productitems);
        res.render('Check-out', { products: productitems, Cart: cartdata, cartdata: cartItems, username:userdata.username,userAddress:addressdata });
    } catch (error) {
        console.log(error.message);
        
    }
};