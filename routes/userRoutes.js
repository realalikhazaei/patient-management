const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  updateDoctor,
} = require('../controllers/userController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router.patch('/update-account/doctor-options', restrictTo('doctor'), updateDoctor);
router.patch('/update-account', updateMe);
router.patch('/delete-account', deleteMe);

router.route('/:_id').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/').get(getAllUsers).post(createUser);

module.exports = router;
