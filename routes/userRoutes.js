const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadPhoto,
  processPhoto,
  updateMe,
  deleteMe,
  updateDoctor,
  getDoctor,
  addSecretary,
} = require('../controllers/userController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.get('/doctor/:_id', getDoctor);

router.use(protectRoute);

router.patch('/add-secretary', restrictTo('admin'), addSecretary);

router.patch('/update-account/doctor-options', restrictTo('doctor'), updateDoctor);
router.patch('/update-account', uploadPhoto, processPhoto, updateMe);
router.patch('/delete-account', deleteMe);

router.route('/:_id').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/').get(getAllUsers).post(createUser);

module.exports = router;
