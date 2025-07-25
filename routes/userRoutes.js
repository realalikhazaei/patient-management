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
  getMe,
  updateDoctor,
  getDoctors,
  getDoctor,
  addSecretary,
} = require('../controllers/userController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.get('/doctor/:_id', getDoctor);
router.get('/doctor', getDoctors, getAllUsers);

router.use(protectRoute);

router.patch('/add-secretary', restrictTo('admin'), addSecretary);

router.patch('/update-account/doctor-options', restrictTo('doctor'), updateDoctor);
router.patch('/update-account', uploadPhoto, processPhoto, updateMe);
router.patch('/delete-account', deleteMe);
router.get('/get-my-info', getMe);

router.route('/:_id').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/').get(getAllUsers).post(createUser);

module.exports = router;
