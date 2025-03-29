const mongoose = require('mongoose');
//mongoose.connect("mongodb://localhost:27017/E-Commerce")
const Couponschema=new mongoose.Schema({
Couponcode:{
    type:String,
    required:true
},
Coupontype:{
    type:String,
    required:true
},
Description:{
    type:String,
    required:true
},
Usagelimit:{
    type:Number,
    required:true
},
Amount:{
    type:Number,
    required:true
},
StartDate: {
    type: Date,
    required: true
},
Expirydate:{
    type:Date,
    required:true
},
Minimumamount:{
    type:Number,
    required:true
},
offer:{
    type:Number,
    default:0,
},
CreatedAt:{
    type:Date,
    default:Date.now
},
usageCount:{
    type:Number,
    default:0
}
})
module.exports=mongoose.model("Coupon",Couponschema)