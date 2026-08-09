const product = require('../../models/productmodel');
const Category = require('../../models/categorymodel')

const productslist = async (req, res) => {
  try {
    
    const { page = 1, limit = 10, search = "" } = req.query 

    const query = {
      isVerified: true,
      productname: { $regex: search, $options: "i" } 
    }

    const totalProducts = await product.countDocuments(query);
    const productData = await product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const CategoryData = await Category.find({})

    res.render('admin-products', {
      products: productData,
      category: CategoryData,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
      searchTerm: search
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
};

const Addproducts = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("Admin-add-pro", { category: categoryData });

  }
  catch (error) {
    console.log(error.message);
  }
}

const insertproduct = async (req, res) => {
  try {

      const { productname, Color, price, description, stock, Brand, Category } = req.body;
      const croppedImages = req.files.map(file => file.filename); 


      const newProduct = new product({
          productname,
          Color,
          price,
          description,
          stock,
          Brand,
          image: croppedImages, 
          Category
      });


      await newProduct.save();

      res.redirect('/admin/products-list');
  } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
  }
};
 
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const productData = await product.findById(id);
    const categoryData = await Category.find({ is_active: false });
 
    if (productData&&categoryData) { 
      res.render("editproduct", {
        products: productData,
        category: categoryData,
      });
    } else {
      res.redirect("/admin/products-list");
    }
  } catch (error) {
    handleServerError(res, error, "Error loading edit product page");
  }
};  

const deleteSingleImage = async (req, res) => {
  try {
    const { productId, filename } = req.body;

    const products = await product.findById(productId);

    
    if (!products) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    const imageIndex = products.image.findIndex(
      (img) => img === filename
    );

    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found in the product" });
    }

    products.image.splice(imageIndex, 1);

    await products.save();

    const filePath = `public/productImage/${filename}`;


    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res
            .status(500)
            .json({ success: false, error: "Error deleting file" });
        }
        return res
          .status(200)
          .json({ success: true, message: "Image deleted successfully" });
      });
    } else {
      console.log("File not found:", filePath);
      return res
        .status(404)
        .json({ success: false, error: "File not found" });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    
    const id = req.query.id;
    const result = await product.updateOne({ _id: id },{$set:{isVerified:false}});

   res.redirect('/admin/products-list')

    
  } catch (error) {
    handleServerError(res, error, "Error deleting product");
  }
};

const updateProducts = async (req, res) => {
  try {
    
    
    const _id = req.body.id;
    


    const {
      productname,
      Brand,
      Description,
      Price,
      Size,
    } = req.body;


  
    const images = req.files


    let imageArray = [];

    if (images) {

      imageArray =  req.files.map(file => file.filename);
    }

    const existingProduct = await product.findById(_id);
   

    const updatedImages = [...existingProduct.image, ...imageArray];
    console.log("Updated Images:", updatedImages);

    if (!existingProduct) {
      
      return res.status(404).json({ error: 'Product not found' });
    }


    
    const productData = await product.findByIdAndUpdate(
      _id,
      {
        productname: productname,
        Brand: Brand,
        description: Description,
        price: Price,
        stock: Size,
        
        image:updatedImages,
        
      },
      { new: true } 
    );

    if (productData) {
      res.redirect("/admin/products-list");
    } else {
      
      res.status(500).json({ error: 'Failed to update product' });
    }
  } catch (error) {

    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to edit products' });
  }
};

module.exports={
    productslist,
    Addproducts,
    insertproduct,
    updateProducts,
    loadEditProduct,
    deleteProduct,
    deleteSingleImage
}