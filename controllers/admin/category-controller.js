const Category = require("../../models/categorymodel");
const Product=require("../../models/productmodel")

// Load Categories Page
const loadCategoriesPage = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    let message;
    if(req.session.message!='')
    {
     message = req.session.message;
    }
    else
    {
    message=''
    }
    res.render("category-products", {message:message,category: categoryData});
    req.session.message=''
    message=''
  } catch (error) {
    console.error("Error in loadCategoriesPage:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Add Category
const addCategory = async (req, res) => {
  try {
    const { catName, liOrUl, offer, offerType} = req.body;
    const catdata=await Category.find({})
    if(catName==''){
      return res.render("category-products",{message:"Category name is required",category:catdata})
    }

    // Case-insensitive search for existing category
    const existingCategory = await Category.findOne({ catName: { $regex: new RegExp(`^${catName}$`, 'i') } });
    if (existingCategory) {
      const categoryData = await Category.find({});
      return res.render("category-products", { message: "Category already exists", category: categoryData });
    }
       
    const isListed = liOrUl === "list" ? false : true;

    const category = new Category({
      catName,
      is_active: isListed,
    });
    

    await category.save();
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error in addCategory:", error.message);
    // Handle the error appropriately, such as sending an error response
    res.status(500).send("Error adding category");
  }
};


// Delete Category
const deleteCategory = async (req, res) => {
  try {
    console.log("entering ")
    const id = req.query.id;
    await Category.deleteOne({ _id: id });
    res.redirect("/admin/categories");
  } catch (error) {
    console.error("Error in deleteCategory:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Update Category
const updateCategory = async (req, res) => {
  try {
    console.log(req.body)
    console.log(req.body._id);
    const selectedList = req.body.liOrUl;
    const listed = selectedList === "list" ? false : true;
    console.log("helllohjfgjg",selectedList);
    console.log("jirafe",listed);
    const exist=req.body.catName
    console.log("mime",exist);
    const offer = req.body.offer;
    const type = req.body.offerType;
console.log(offer,type,"offer and offer and offertype");
    const categorylist=await Category.find({})
console.log(categorylist,"categorylidt")
    const existingproducts = await Category.findOne({_id: { $ne: req.body._id  } ,catName: { $regex: new RegExp(exist, 'i') } });
        if (existingproducts)
         {
           res.render("category-products", {message: "Category already exists",category:categorylist});
           }
        
     else{   
      req.session.message=''
    const categoryData = await Category.findByIdAndUpdate(
      { _id: req.body._id },
      {
        $set: {
          catName: req.body.catName,
          offer:offer,
          offerType:type,
          is_active: listed,
        },
      }
    );
  

    res.redirect("/admin/categories");
     }
  } catch (error) {
    console.error("Error in updateCategory:", error.message);
    res.status(500).send("Internal Server Error");
  }
};

// Assuming you're using Express.js for your server

// Store the original price in a temporary storage (in-memory cache)
let originalPriceCache = {};

const addCategoryOffer = async (req, res) => {
  try {
      const percentage = parseInt(req.body.percentage);
      const categoryId = req.body.categoryId;

        // Check if the percentage exceeds the allowed limit
    if (percentage >= 90) {
       res.json({ status:false,message: "Offer can be applied only below 90 percent" });
    }

      const findCategory = await Category.findOne({ _id: categoryId });
      console.log(findCategory);

      await Category.updateOne(
          { _id: categoryId },
          {
              $set: {
                  offer: percentage
              }
          }
      )
      .then(data => {
          console.log(data);
          console.log("categoryOffer added");
      });

      const productData = await Product.find({ Category: categoryId, isVerified: true });
      console.log(productData);

      for (const product of productData) {
           product.originalprice = product.price; // Store original price
           const originalprice=product.originalprice
          console.log("before offer", product.originalprice);
          product.price -= Math.floor(product.price * (percentage / 100));
          await product.save();

          // Store the original price in the cache
          originalPriceCache[product._id.toString()] = originalprice.toString();
      }

      res.json({ status: true });

  } catch (error) {
      console.log(error.message);
  }
}


const removerCategoryOffer = async (req, res) => {
    try {
        console.log(req.body);
        const categoryId = req.body.categoryId;
        const findCategory = await Category.findOne({ _id: categoryId });
        console.log(findCategory);

        const percentage = findCategory.offer;
        console.log(percentage);

        const productData = await Product.find({ Category: categoryId, isVerified: true });

        if (productData.length > 0) {
            for (const product of productData) {
                const originalprice =product.originalprice;
                if (originalprice) {
                    product.price = originalprice; // Use original price from cache
                    await product.save();
                } else {
                    console.log("Original price not found for product:", product._id);
                }
            }
        }

        findCategory.offer= 0;
        await findCategory.save();

        // Clear the cache after use
        originalPriceCache = {};

        res.json({ status: true });

    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
  loadCategoriesPage,
  addCategory,
  deleteCategory,
  updateCategory,
  addCategoryOffer,
  removerCategoryOffer
}