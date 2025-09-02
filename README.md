# 🏥 Patient Management System
A robust backend system designed and developed from scratch for managing a medical clinic's operations.
The project features meticulous data modeling and a well-documented API using Swagger, enabling clear and efficient interaction with the system's resources.

## Key Features:

* Multi-Role System: Clearly defined roles for Doctors, Secretaries, Patients and Admins.
* Appointment Management: Book appointments based on doctor availability, with a full lifecycle from scheduling to completion.
* Prescriptions & Reviews: Doctors can add prescriptions for patients, and patients can review completed appointments.
* Flexible Authentication: Supports standard JWT login as well as passwordless login via phone number and OTP.
* API Documentation: Comprehensive and interactive API documentation with Swagger.

## Tech Stack:

* Backend: Node.js, Express.js
* Database: MongoDB with Mongoose
* Authentication: JWT, Nodemailer, OTP
* API Documentation: Swagger Docs

## Setup and Installation


1. Clone the master-docs branch of repository

```
git clone --branch master-docs https://github.com/realalikhazaei/patient-management
```

2. Install the required dependencies:

```
npm install
```

3. Create a config.env file in the root directory and add the environment variables.

```
//Example Variables

NODE_ENV = <development or production>
DATABASE_URI = <your_mongodb_connection_string>
BCRYPT_COST = <password hashing cost - 12 is recommended>
VISIT_RANGE = <allowed doctor appointments booking time range per days>
JWT_SECRET = <your_jwt_secret>
JWT_EXPIRES_IN = <jwt expiration time>
OTP_EXPIRES_MIN = <otp expiration time per minutes>
PASS_RESET_EXPIRES_MIN = <password reset token expiration time per minutes>
EMAIL_VERIFY_EXPIRES_MIN = <email verification expiration expiration time per minutes>
COOKIE_EXPIRES = <cookie expiration time - enter the days number>
SMTP_FROM = <your smtp source email>
SMTP_HOST = <smtp service host>
SMTP_PORT = <smtp service port>
SMTP_USER = <your smtp service username>
SMTP_PASS = <your smtp service password>
```

4. Start the server

```
//Development environment

npm start
```

```
//Production environment

npm run start:prod
```
