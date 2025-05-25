const nodemailer = require('nodemailer');

const Email = class {
  constructor(user, text) {
    this.name = user.name.split(' ')[0];
    this.from = process.env.MAILTRAP_FROM;
    this.to = user.email;
    this.text = text;
  }

  transporter() {
    if (process.env.NODE_ENV === 'development') {
      return nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    }
  }

  async send(subject, text) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text,
    };

    await this.transporter().sendMail(mailOptions);
  }

  async sendResetPassword() {
    await this.send('Your password reset link (expires in 10 mins)', this.text);
  }
};

module.exports = Email;
