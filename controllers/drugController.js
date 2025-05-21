const factory = require('./handlerFactory');
const Drug = require('../models/drugModel');

const getAllDrugs = factory.getAll(Drug);

const getDrug = factory.getOne(Drug);

const createDrug = factory.createOne(Drug);

const updateDrug = factory.updateOne(Drug);

const deleteDrug = factory.deleteOne(Drug);

module.exports = { getAllDrugs, getDrug, createDrug, updateDrug, deleteDrug };
