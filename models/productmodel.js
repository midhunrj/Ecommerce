const mongoose=require("mongoose")


const productSchema = new mongoose.Schema({
productname: {
    type: String,
    required: true
},
Category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
description: {
    type: String,
    required: true,
},
Brand:{
    type:String,
    required:true,
},
price: {
    type:Number,
    required: true,
},
originalprice:{
    type:Number,
    
    
},
isVerified:{ 
    type: Boolean,
    default: true},
image:{
    type:Array,
    required:true,
},
stock:{
    type:Number,
    required:true,
},

Color:{
    type:String,
    required:true
},
offer:{
    type:Number,
    default:0,
    required:true
}
})
module.exports = mongoose.model('products', productSchema);