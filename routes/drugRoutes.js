const express = require('express');
const { getAllDrugs, getDrug, createDrug, updateDrug, deleteDrug } = require('../controllers/drugController');
const { protectRoute, restrictTo } = require('../controllers/authController');

const router = express.Router();

router.use(protectRoute);

router
  .route('/:_id')
  .get(restrictTo('admin', 'doctor'), getDrug)
  .all(restrictTo('admin'))
  .patch(updateDrug)
  .delete(deleteDrug);
router.route('/').get(restrictTo('admin', 'doctor'), getAllDrugs).post(restrictTo('admin'), createDrug);

module.exports = router;
