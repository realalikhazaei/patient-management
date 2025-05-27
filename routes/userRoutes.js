const express = require('express');
const { getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe } = require('../controllers/userController');
const { protectRoute } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router.patch('/update-account', updateMe);

router.route('/:_id').get(getUser).patch(updateUser).delete(deleteUser);
router.route('/').get(getAllUsers).post(createUser);

module.exports = router;
