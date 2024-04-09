const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true,
        index: { expires: 0 } 
    },
    image: {
        type: String, // Assuming you'll store the image path
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'

    },
    bannerType:{
        type:String,
        required:true,
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
