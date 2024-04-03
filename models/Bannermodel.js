const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
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
        required: true
    },
    image: {
        type: String, // Assuming you'll store the image path
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
