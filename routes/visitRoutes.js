const express = require('express');
const {
  getAllVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  addUserID,
  checkVisitTime,
  bookMyVisit,
  updateMyVisit,
  deleteMyVisit,
} = require('../controllers/visitController');
const { protectRoute } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router
  .route('/:_id/patient')
  .all(addUserID)
  .get(getVisit)
  .patch(checkVisitTime, updateMyVisit, updateVisit)
  .delete(deleteMyVisit, deleteVisit);
router.route('/patient').all(addUserID).get(getAllVisits).post(checkVisitTime, bookMyVisit);

router.route('/:_id').get(getVisit).patch(updateVisit).delete(deleteVisit);
router.route('/').get(getAllVisits).post(createVisit);

module.exports = router;
