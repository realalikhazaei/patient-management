const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis();

const myQueue = new Queue('myQueue', { connection });

module.exports = myQueue;
