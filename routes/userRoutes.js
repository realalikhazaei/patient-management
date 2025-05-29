const express = require('express');
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/userController');
const { protectRoute } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router.patch('/update-account', updateMe);
router.patch('/delete-account', deleteMe);

router.route('/:_id').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/').get(getAllUsers).post(createUser);

module.exports = router;
