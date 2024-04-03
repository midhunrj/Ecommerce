const user = require('../models/usermodel')
const Banner=require("../models/Bannermodel")

const bannerupload=async(req,res)=>{
    try{
     
        res.render("banner-upload")
        
    }
    catch(error)
    {
        console.log(error.message);
    }
}

const insertBanner = async (req, res) => {
    try {
        const { description, startDate, endDate, status } = req.body;
        const imageUrl = req.file.filename; // Assuming the uploaded image is stored in a single file
console.log(req.body,"banner");
        // Create a new banner instance
        const newBanner = new Banner({
            description,
            startDate,
            endDate,
            image:imageUrl,
            status
        });

        // Save the new banner to the database
        await newBanner.save();

        // Respond to the client with a success message or redirect to a success page
        res.redirect('/admin/bannerlist');
    } catch (error) {
        console.error('Error adding banner:', error);
        res.status(500).json({ error: 'Failed to add banner' });
    }
};

const bannerlist=async(req,res)=>{
    try{
     
        const bannerdata=await Banner.find()
        res.render("banners-list",{banners:bannerdata})
        
    }
    catch(error)
    {
        console.log(error.message);
    }
}

module.exports={
    bannerupload,
    insertBanner,
    bannerlist
}