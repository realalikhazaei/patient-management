const APIFeatures = class {
  constructor(queryObj, queryStr) {
    this.queryObj = queryObj;
    this.queryStr = queryStr;
  }

  filter() {
    let queryStr = { ...this.queryStr };
    ['sort', 'fields', 'page', 'limit'].forEach(el => delete queryStr[el]);
    queryStr = JSON.stringify(queryStr).replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    queryStr = JSON.parse(queryStr);
    this.queryObj.find(queryStr);

    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.queryObj.sort(sortBy);
    } else this.queryObj.sort('-createdAt');

    return this;
  }

  projection() {
    if (this.queryStr.fields) {
      const selectBy = this.queryStr.fields.split(',').join(' ');
      this.queryObj.select(selectBy);
    } else this.queryObj.select('-__v');

    return this;
  }

  pagination() {
    const page = this.queryStr.page || 1;
    const limit = this.queryStr.limit || 10;
    const skip = (page - 1) * limit;
    this.queryObj.skip(skip).limit(limit);

    return this;
  }
};

module.exports = APIFeatures;
