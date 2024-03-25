 const mongoose=require("mongoose")
// mongoose.connect("mongodb://localhost:27017/E-Commerce")

const AddressSchema = new mongoose.Schema({
userid:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true

    },
    Address:[{
        Addresstype:{
        type: String,
        default:true
    },
    name:{
        type: String,
        required: true
    },
    address:{
        type:String,
        required:true
    },
    landmark:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true,
    },
    state:{
        type:String,
        required:true,
    },
    pincode: {
        type:Number,
        required: true,
    },
    phone: {
        type:Number,
        required: true,
    },
    altphone: {
        type:Number,
        required: true,
    },
    isVerified:{ 
        type: Boolean,
        default: true},
    
    country:{
        type:String,
        required:true,
    }}]
    })
    module.exports = mongoose.model('Address', AddressSchema);
