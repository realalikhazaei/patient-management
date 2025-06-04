const express = require('express');
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  addPatientID,
  updateMyReview,
  addMyReview,
} = require('../controllers/reviewController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router
  .route('/:_id/patient')
  .all(restrictTo('patient'), addPatientID)
  .get(getReview)
  .patch(updateMyReview, updateReview)
  .delete(deleteReview);
router.route('/patient').post(restrictTo('patient'), addMyReview);

router.use(restrictTo('admin'));

router.route('/:_id').get(getReview).patch(updateReview).delete(deleteReview);
router.route('/').get(getAllReviews).post(createReview);

module.exports = router;
