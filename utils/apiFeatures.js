const APIFeatures = class {
  constructor(queryObj, queryStr) {
    this.queryObj = queryObj;
    this.queryStr = queryStr;
  }

  filter() {}

  sort() {}

  projection() {}

  pagination() {}
};

module.exports = APIFeatures;
