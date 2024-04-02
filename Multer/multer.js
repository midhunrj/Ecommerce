const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,  path.join(__dirname, "../public/productImage")); // Specify the destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    console.log("//////////////////////////////");

    console.log(file);
    cb(null, Date.now() + '-' + file.originalname); // Define the file name
  },
});


const upload = multer({
  storage: storage,
  limits: {
      fieldSize: 10 * 1024 * 1024, // Adjust the field size limit as needed (10MB in this example)
  }
});
module.exports = upload;
