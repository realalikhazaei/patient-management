const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const reminderEmail = require('./reminderEmail');
const logError = require('./logError');

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
  'myQueue',
  async job => {
    try {
      await reminderEmail(job.data);
    } catch (err) {
      await logError(job, err);
      return;
    }
  },
  { connection },
);

module.exports = worker;
