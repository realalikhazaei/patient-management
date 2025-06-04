const hpp = obj => {
  const object = { ...obj };
  for (const [key, value] of Object.entries(object)) {
    if (Array.isArray(value)) {
      if (['duration', 'difficulty', 'price', 'ratingsAverage'].includes(key)) continue;
      else object[key] = value.at(-1);
    }
  }
  return object;
};

module.exports = hpp;
