const yaml = require('yamljs');

const swaggerDoc = yaml.load(`${__dirname}/openapi-specs.yaml`);

module.exports = swaggerDoc;
