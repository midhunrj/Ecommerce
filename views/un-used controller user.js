      // Brand filtering
      const selectedBrands = req.query.brands;
      if (selectedBrands) {
        const lowercasedBrands = selectedBrands.toLowerCase();
        productQuery.Brand = {
          $regex: new RegExp(lowercasedBrands.split(",").join("|"), "i"),
        };
      } 

      // Color filtering
    const selectedColors = req.query.colors;
    if (selectedColors) {
      productQuery.color = {
        $in: selectedColors.split(","),
      };
    }
    const loggedIn = req.session.isAuth ? true : false;
    const availableColors = ['Red', 'Green', 'Blue'];

    availableColors: availableColors,
   module.exports = {
    shoppage,
    // Add other controller functions as needed
  };
  
  
  
  
  
  const shopList = async (req, res) => {
    try {
      const search = req.query.search;
      const sortCategory = req.query.id;
      const page = req.query.page || 0;
      const productsPerPage = 6;
  
      let productQuery = {};
  
      if (search) {
        productQuery = {
          productName: { $regex: "." + search + "." },
        };
      } else if (sortCategory) {
        productQuery = { category: sortCategory };
      }
  
      const priceRange = req.query.priceRange;
  
      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split("-");
        productQuery.regularPrice = {
          $gte: Number(minPrice),
          $lte: Number(maxPrice),
        };
      }
  
      const selectedBrands = req.query.brands;
  
      if (selectedBrands) {
        const lowercasedBrands = selectedBrands.toLowerCase();
        productQuery.Brand = {
          $regex: new RegExp(lowercasedBrands.split(",").join("|"), "i"),
        };
      }
  
      const selectedSizes = req.query.sizes;
  
      if (selectedSizes) {
        productQuery.size = {
          $in: selectedSizes.split(","),
        };
      }
  
      const totalNumberOfProducts = await product.find(
        productQuery
      ).countDocuments();
  
      const totalNumberOfPages = Math.ceil(
        totalNumberOfProducts / productsPerPage
      );
  
      const productData = await product.find(productQuery)
        .skip(page * productsPerPage)
        .limit(productsPerPage);
  
      const categoryData = await Category.find({});
      const loggedIn = req.session.isAuth ? true : false;
  
      if (productData && categoryData) {
        res.render("user-shop", {
          loggedIn,
          category: categoryData,
          products: productData,
          page: page,
          totalNumberOfPages,
        });
      }
    } catch (error) {
      handleServerError(res, error, "Error loading shop list");
    }
  };