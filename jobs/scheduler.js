const cron = require('node-cron');
const myQueue = require('./queue');
const Visit = require('../models/visitModel');

const fetchDataAndQueueJobs = async function () {
  const tomorrow = {
    start: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 1}`);
    },
    end: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 2}`);
    },
  };

  /* const visits = await Visit.find({ dateTime: { $gt: tomorrow.start(), $lt: tomorrow.end() } })
    .populate({ path: 'patient', select: 'name email' })
    .populate({ path: 'doctor', select: 'name' }); */
  const data = {
    dateTime: Date.now(),
    patient: { name: 'Ali Khazaei', email: 'ali.khazaii88@gmail.com' },
    doctor: { name: 'Hossein Mehrzad' },
  };

  // for (const visit of visits)
  //   await myQueue.add('reminder-email', visit, {
  //     attempts: 5,
  //     backoff: { type: 'exponential', delay: 1000 },
  //     removeOnComplete: true,
  //     removeOnFail: false,
  //   });

  await myQueue.add('reminder-email', data, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
};

cron.schedule('0 * * * * *', async () => await fetchDataAndQueueJobs());
