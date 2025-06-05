const sanitize = obj => {
  const object = { ...obj };
  for (const value of Object.values(object))
    if (value instanceof Object) {
      for (const k of Object.keys(value)) if (/^[$.]/g.test(k)) delete value[k];
    }
  return object;
};

module.exports = sanitize;
