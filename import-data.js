/* eslint-disable */
require('dotenv').config({ path: 'config.env' });
const fs = require('fs');
const mongoose = require('mongoose');

const DB = process.env.DATABASE_CONNECT.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB)
  .then(() => console.log('Connection to the database has been established'))
  .catch(() => console.log('There has been a problem connecting to the database'));

const importData = async Model => {
  const data = fs.readFileSync(`${__dirname}/dev-data/${Model}s.json`);
  await require(`./models/${Model}Model`).create(JSON.parse(data));
  console.log('Data has been imported successfully');
  process.exit();
};

const deleteData = async Model => {
  await require(`./models/${Model}Model`).deleteMany();
  console.log('Data has been deleted successfully');
  process.exit();
};

if (process.argv[2] === '--import') importData(process.argv[3]);
if (process.argv[2] === '--delete') deleteData(process.argv[3]);
