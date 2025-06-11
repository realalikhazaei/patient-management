const Email = require('../utils/email');

const reminderEmail = async function (visit) {
  console.log('Sending reminder...');
  return await new Email(visit.patient).sendVisitReminder(visit);
};

module.exports = reminderEmail;
