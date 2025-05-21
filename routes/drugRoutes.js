const express = require('express');
const { getAllDrugs, getDrug, createDrug, updateDrug, deleteDrug } = require('../controllers/drugController');

const router = express.Router();

router.route('/:_id').get(getDrug).patch(updateDrug).delete(deleteDrug);
router.route('/').get(getAllDrugs).post(createDrug);

module.exports = router;
