const mongoose=require("mongoose")


const categorySchema = new mongoose.Schema({
catName:{
   type:String,
   required:true
},
is_active:{
    type:Boolean,
    required:true
},
offer: {
    type: Number,
    default: 0
},
offerType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
}
})
module.exports = mongoose.model('Category',categorySchema);    