/* eslint-disable */
const supertest = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/userModel');

describe('Users routes', () => {
  beforeAll(async () => {
    const DB =
      'mongodb+srv://Ali:88412114@cluster0.yihgv.mongodb.net/patient_management_testing?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(DB);
  });

  describe('GET /api/v1/users/doctor Get All Doctors', () => {
    test('should return success', async () => {
      const res = await supertest(app).get('/api/v1/users/doctor');
      expect(res.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/users/doctor/:id Get Doctor With Visits and Reviews', () => {
    test('should return fail with incorrect doctor ID', async () => {
      const res = await supertest(app).get('/api/v1/users/doctor/683ae5d3264976ccf7239f27');
      console.log(res.body);
      expect(res.body.status).toBe('fail');
    }, 15000);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
  });
});
