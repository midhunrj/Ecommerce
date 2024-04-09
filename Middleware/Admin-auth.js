
const User = require('../models/usermodel');
async function getUserFromDatabase(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
}

const isLogin = async (req, res, next) => {
  try {
    const admin = await getUserFromDatabase(req.session.admin);
    //  console.log("tgsu is",user);
    if (admin && admin.is_admin === 1) {
      console.log('Admin here');
      next();
    } else {
      res.redirect('/admin');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if(req.session.admin){
       const admin = await getUserFromDatabase(req.session.admin);
    //  console.log("tgsu is",user);
    if (admin && admin.is_admin === 1) {
      next();
    }else{
      next();

    }
   
  }
 } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  
  isLogin,
  isLogout,
  
};
