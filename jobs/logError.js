const winston = require('winston');

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

module.exports = logError;
