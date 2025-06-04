const xss = require('xss');

const htmlClean = obj => {
  const object = { ...obj };
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'string') object[key] = xss(value);
  }

  return object;
};

module.exports = htmlClean;
