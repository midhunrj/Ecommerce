const product = require('../../models/productmodel');
const Category = require('../../models/categorymodel')

const productslist = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Get query parameters

    const query = {
      isVerified: true,
      productname: { $regex: search, $options: "i" } // Case-insensitive search
    };

    const totalProducts = await product.countDocuments(query);
    const productData = await product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const CategoryData = await Category.find({});

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
      const croppedImages = req.files.map(file => file.filename); // Extract filenames of cropped images from req.files array


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

      // Save the new product to the database
      await newProduct.save();
      // Respond to the client with a success message
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
    console.log("this is pro", productId, "\nthis is file", filename);
    console.log("gingika");

    const products = await product.findById(productId);

    console.log("plinch");
    if (!products) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    console.log("hello guys");
    const imageIndex = products.image.findIndex(
      (img) => img === filename
    );

    console.log("image index is here", imageIndex);
    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found in the product" });
    }

    console.log("hl my friend");
    products.image.splice(imageIndex, 1);

    await products.save();

    console.log("fly high");
    const filePath = `public/productImage/${filename}`;

    // Check if the file exists before trying to delete
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
          return res
            .status(500)
            .json({ success: false, error: "Error deleting file" });
        }
        console.log("jigarthanda");
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
    console.log("entering");
    const id = req.query.id;
    const result = await product.updateOne({ _id: id },{$set:{isVerified:false}});

   res.redirect('/admin/products-list')

    
  } catch (error) {
    handleServerError(res, error, "Error deleting product");
  }
};

const updateProducts = async (req, res) => {
  try {
    console.log(req.body); // Should now include form data
    console.log(req.file);
    console.log("Entering updateProducts");
    const _id = req.body.id;
    

    console.log("Product ID:", _id);

    const {
      productname,
      Brand,
      Description,
      Price,
      Size,
    } = req.body;
    console.log("Request Body:", req.body);

    console.log(req.files);
    const images = req.files
    console.log("Image Details:", images);

    let imageArray = [];

    if (images) {
      console.log("Image file entered");

      // Ensure imageArray is an array containing the filename
      imageArray =  req.files.map(file => file.filename);
    }

    const existingProduct = await product.findById(_id);
   

    const updatedImages = [...existingProduct.image, ...imageArray];
    console.log("Updated Images:", updatedImages);

    if (!existingProduct) {
      // Handle the case where the product with the specified ID is not found
      return res.status(404).json({ error: 'Product not found' });
    }

    //Concatenate existing images and the new image filename
    
    const productData = await product.findByIdAndUpdate(
      _id,
      {
        productname: productname,
        Brand: Brand,
        description: Description,
        price: Price,
        stock: Size,
        // Include any other fields you need to update
        image:updatedImages,
        
      },
      { new: true } // To get the updated document as a result
    );

    if (productData) {
      res.redirect("/admin/products-list");
    } else {
      // Handle the case where the product update fails
      res.status(500).json({ error: 'Failed to update product' });
    }
  } catch (error) {
    // Handle errors that occur during the update process
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