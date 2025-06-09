const express = require('express');
const {
  getAllVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  addPatientID,
  checkVisitTime,
  bookMyVisit,
  updateMyVisit,
  deleteMyVisit,
  getPrescription,
  addPrescription,
  deletePrescription,
  addDoctorID,
  getDoctorVisit,
  getTodayVisits,
  closeAVisit,
} = require('../controllers/visitController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.get('/:_id/prescription', getPrescription);

router.use(protectRoute);

router.route('/:_id/prescription').all(restrictTo('doctor')).patch(addPrescription).delete(deletePrescription);

router.get('/:_id/doctor', restrictTo('doctor'), getDoctorVisit);
router.get('/doctor/today', restrictTo('doctor', 'secretary'), addDoctorID, getTodayVisits);
router.get('/doctor', restrictTo('doctor', 'secretary'), addDoctorID, getAllVisits);
router.patch('/:_id/doctor/close-visit', restrictTo('doctor', 'secretary'), addDoctorID, closeAVisit);

router
  .route('/:_id/patient')
  .all(restrictTo('patient'), addPatientID)
  .get(getVisit)
  .patch(checkVisitTime, updateMyVisit, updateVisit)
  .delete(deleteMyVisit, deleteVisit);
router.route('/patient').all(restrictTo('patient'), addPatientID).get(getAllVisits).post(checkVisitTime, bookMyVisit);

router.route('/:_id').get(getVisit).patch(updateVisit).delete(deleteVisit);
router.route('/').get(getAllVisits).post(createVisit);

module.exports = router;
