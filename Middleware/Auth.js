const User = require('../models/usermodel');

async function getUserFromDatabase(userId) {
  try {
    const user = await User.findOne({_id:userId});
    return user;
  } catch (error) {
    console.error('Error fetching user from database:', error);
    throw error;
  }
}

const isLogin = async (req, res, next) => {
  try {
    const user = await getUserFromDatabase(req.session.user);

    if (user && user.is_admin === 0) {
      console.log('User here');
      next();
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    const user = await getUserFromDatabase(req.session.user);

    if (user && user.is_admin == 0) {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};


const isUserBlocked = async (req, res, next) => {
  try {
    const user = await getUserFromDatabase(req.session.user);
    //  console.log("tgsu is",user);
    if (user && user.is_blocked === 0) {
      next();
    } else {
      req.session.user=null
      res.redirect('/')
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getUserFromDatabase,
  isLogin,
  isLogout,
  isUserBlocked,
};
