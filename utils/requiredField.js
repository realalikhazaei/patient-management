const requiredField = fieldsObj => {
  const fieldErrors = {
    name: 'Please provide your name',
    email: 'Please provide your email address',
    idCard: 'Please provide your ID card number',
    password: 'Please provide a password',
    passwordConfirm: 'Please confirm your password',
    currentPassword: 'Please provide your current password',
    specification: 'Please provide your specification',
    mcNumber: 'Please provide your MC number',
  };

  const errors = Object.entries(fieldsObj).reduce((acc, cur) => {
    if (!cur[1]) acc[cur[0]] = fieldErrors[cur[0]];
    return acc;
  }, {});

  return errors;
};

module.exports = requiredField;
