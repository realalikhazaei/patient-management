const cron = require('node-cron');
const winston = require('winston');
const { Queue, Worker } = require('bullmq');
const User = require('../models/userModel');
// const Visit = require('../models/visitModel');

cron.schedule('0 * * * * *', async () => await fetchDataAndQueueJobs());
// cron.schedule('* 07 * * *', async () => await fetchDataAndQueueJobs());

const myQueue = new Queue('myQueue');

const reminderEmail = async function (user) {
  return console.log(`Hello ${user.name}`);
};

const logError = async function (job, error) {
  const logger = winston.createLogger({
    level: 'error',
    format: winston.format.json(),
    transports: [new winston.transports.File({ filename: 'failed-jobs.log' })],
  });

  logger.error({
    jobId: job.id,
    data: job.data,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
};

const fetchDataAndQueueJobs = async function () {
  const tomorrow = {
    start: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 1}`);
    },
    end: function () {
      return new Date(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() + 2}`);
    },
  };

  const visits = await User.find();
  // const visits = await Visit.find({ dateTime: { $gt: tomorrow.start(), $lt: tomorrow.end() } });

  for (const visit of visits)
    await myQueue.add('reminder-email', visit, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
};

const worker = new Worker('myQueue', async job => {
  try {
    await reminderEmail(job.data);
  } catch (err) {
    await logError(job, err);
    return;
  }
});
