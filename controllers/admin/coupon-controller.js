const Coupon=require('../../models/couponmodel')
const couponpage=async(req,res)=>{
  try{
      res.render("new-coupon")
  }
  catch(error)
  {
      console.log(error.message);
  }
}
const newCoupon = async (req, res) => {
    try {
        const { code, type,limit,startdate,expirydate, description, amount,miniamount} = req.body;
    
        // const expirydate=req.body[Expiry-date]
        
        
        console.log('Coupon code:', code);
        console.log('Coupon type:', type);
        console.log('Expiry date: ',expirydate);
        console.log('Description:', description);
        console.log('Amount:', amount);
     
        const coupon=new Coupon({
        Couponcode:code,
        Coupontype:type,
        Usagelimit:limit,
        StartDate:startdate,
        Expirydate:expirydate,
        Amount:amount,
        Description:description,
        Minimumamount:miniamount
        })
        
        await coupon.save()
        res.redirect('/admin/coupons')
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('An error occurred while creating the coupon.');
    }
}
const Couponlist=async(req,res)=>{
  try{
    const Coupondata=await Coupon.find({})
      res.render("Coupons-list",{Coupons:Coupondata})
  }

catch(error){
  console.log(error.message);
}
}

const coupondelete=async(req,res)=>{
  try{
    const coup=req.query.coupon
    
    const { code, type,limit,expirydate, description, amount,miniamount} = req.body;
    await Coupon.findByIdAndDelete({coup})
  }
  catch(error)
  {
    console.log(error.message);
  }
}

const couponeditpage=async(req,res)=>{
  try{
    const coup=req.query.coupon
    const coupondata=await Coupon.findOne({_id:coup})
    if(!coupondata)
    {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.render('edit-coupon',{Coupons:coupondata})
}
  catch(error) 
  {
    console.log(error.message);
  }
}

const couponupdate=async(req,res)=>{
  try{
    const coup=req.query.id

    const { code, type,limit,expirydate, description, amount,miniamount} = req.body;
    const coupondata=await Coupon.findOneAndUpdate({_id:coup},{$set:{ Couponcode:code,
      Coupontype:type,
      Usagelimit:limit,
      Expirydate:expirydate,
      Amount:amount,
      Description:description,
      Minimumamount:miniamount}})
    if(coupondata)
    {
    res.redirect('/admin/coupons')
}
}
  catch(error)
  {
    console.log(error.message);
  }
}
module.exports={
    coupondelete,
    couponeditpage,
    couponpage,
    couponupdate,
    newCoupon,
    Couponlist
}