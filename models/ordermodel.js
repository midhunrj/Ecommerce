const mongoose=require("mongoose");
const { ref } = require("pdfkit");


const orderSchema = new mongoose.Schema({
  products:{
    type:Array,
    required:true,
    ref:'products'
  },
  Totalprice:{
    type:Number,
    required:true
  },
  Address:{
    type:Array,
    required:true
  },
  payment:{
    type:String,
    required:true
  },
  paymentstatus:{
    type:String,
    required:true
  },
  Status:{
    type:String,
    required:true
  },
 userId:{
    type:String,
    required:true
 },
 placedon:{
  type:Date,
  required:true
 },
 Date:{
    type:String
 },
Order_verified:{
  type:Boolean,
  default:true
}
})   

module.exports = mongoose.model('Order',orderSchema); 
