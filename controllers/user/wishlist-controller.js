const mongoose=require('mongoose')
const user = require('../../models/usermodel');

const wishlistpage=async(req,res)=>{
    try{
      let userid=req.session.user
      let count=req.session.count

     const userdata = await user.aggregate([{$match:{_id:new mongoose.Types.ObjectId(userid)}},{$lookup:{from:"products",localField:"wishlist",foreignField:"_id",as:"populatedwishlist"}}])
     
     let wishcount=req.session.wishcount
      res.render('wishlist',{username:userdata[0].username,count,wishlist:userdata[0].populatedwishlist,wishcount,search:req.query.search})
    }
    catch(error)
    {
      console.log(error);
    }
  }
  
  const  addtoWishlist=async(req,res)=>{
    try{
  let productid =req.body.productId
  
  
      let userid=req.session.user
      if (!userid) {
        return res.status(HttpStatusCodes.UNAUTHORIZED).json({ success: false, message: "You must login" });
    }
       const existuser = await user.findOne({ _id: userid, wishlist:{$in: [new mongoose.Types.ObjectId(productid)] }});
    
      
      if(existuser)
      {
        
        return res.status(HttpStatusCodes.OK).json({red:true,message:"product is already added to wishlist"})
      }
      else
      {
        const userdata = await user.findOneAndUpdate(
        { _id: userid },
        { $addToSet: { wishlist: new mongoose.Types.ObjectId(productid) }}
      );
      
      
      return res.status(HttpStatusCodes.OK).json({green:true,message:"product has been marked as favourite and added to wishlist"})
      }
    }
      catch(error)
      {
        console.log(error);
      }
  }
  
  const removewishlist=async(req,res)=>{
    try{
      
      let userid=req.session.user
      let productid=req.params.pro
      let productobj=new mongoose.Types.ObjectId(productid)

      let wishcount=req.session.wishcount
      wishcount-=1
      req.session.wishcount=wishcount
      const userdata=await user.updateOne({_id:userid},{$pull:{wishlist:productobj}})
      res.redirect('/wishlist')
    }
    catch(error)
    {
      console.log(error.message);
    }
  }

  
  module.exports={
    addtoWishlist,
    removewishlist,
    wishlistpage
  }