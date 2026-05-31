const user = require('../../models/usermodel')
const Banner=require("../../models/Bannermodel")

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

        console.log("hello its banner time")

        const { name, bannerType, description, startDate, endDate, status } = req.body
        
        const imageUrl = req.file.filename 
console.log(req.body,"banner")


        const newBanner = new Banner({
            name,
            description,
            startDate,
            endDate,
            image:imageUrl,
            status,
            bannerType

        });


        await newBanner.save()

         

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

const updatebanners=async (req, res) => {
    try {
        const updatedBanners = req.body 

        for (const updatedBanner of updatedBanners) {
            const { id, status, bannerType } = updatedBanner
            await Banner.findByIdAndUpdate(id, { status, bannerType });
        }

        res.status(200).json({ message: 'Banners updated successfully' });
    } catch (error) {
        console.error('Error updating banners:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
module.exports={
    bannerupload,
    insertBanner,
    bannerlist,
    updatebanners
}