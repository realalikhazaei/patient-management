const express = require('express');
const {
  getAllVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  addUserID,
  bookVisit,
  updateMyVisit,
  deleteMyVisit,
  addPrescription,
  deletePrescription,
} = require('../controllers/visitController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router.route('/:id/prescription').all(restrictTo('doctor')).patch(addPrescription).delete(deletePrescription);

router
  .route('/:_id/patient')
  .all(addUserID)
  .get(getVisit)
  .patch(updateMyVisit, updateVisit)
  .delete(deleteMyVisit, deleteVisit);
router.route('/patient').all(addUserID).get(getAllVisits).post(bookVisit);

router.route('/:_id').get(getVisit).patch(updateVisit).delete(deleteVisit);
router.route('/').get(getAllVisits).post(createVisit);

module.exports = router;
