const cron = require('node-cron');
const myQueue = require('./queue');
const User = require('../models/userModel');

const fetchDataAndQueueJobs = async function () {
  /* const tomorrow = {
    start: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 1}`);
    },
    end: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 2}`);
    },
  }; */

  const visits = await User.find();

  for (const visit of visits)
    await myQueue.add('reminder-email', visit, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
};

cron.schedule('0 * * * * *', async () => await fetchDataAndQueueJobs());
