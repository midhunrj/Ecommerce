const mongoose=require("mongoose")
//mongoose.connect("mongodb://localhost:27017/E-Commerce")

const userSchema = new mongoose.Schema({
 username: {
    type: String, 
    required: true  
},
email: { 
    type: String,
    required: true
},
phone: { 
    type: String,
    required: true
},  
password: {
    type: String,
    required: true
},
is_admin: {
    type: Number,
    required: true
},
isVerified:{ 
    type: Boolean,
    default: false,
    requird:true },
otp:{
    type:Number,
    required:true
},
token:{
    type:String,
    default:''
},
is_blocked:{
    type:Number,
    default:0
},
wallet:{
    type:Number,
    default:0,
    required:true
},
profilePicture:{
    type:String,
    default:''
},
coupons: [
    {
      couponCode: String,
      usageCount: Number
    }
  ],
history:{
    type:Array,
      amount:{
            type:Number,
            required:true,
        },
        status:{
            type:String,
            required:true,
        },
        timestamp:
        {
            type:Date,
            default:Date.now()
        },
    
},
wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'products' // Reference to the Product model
}]
})
module.exports = mongoose.model('user', userSchema);
