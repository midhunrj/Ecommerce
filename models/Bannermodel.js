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
        
    },
    image: {
        type: String,
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
