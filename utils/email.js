const nodemailer = require('nodemailer');

const Email = class {
  constructor(user, text) {
    this.name = user.name?.split(' ')[0] || 'Dear';
    this.from = process.env.SMTP_FROM;
    this.to = user.email;
    this.text = text;
  }

  transporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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

  async sendVerifyEmail() {
    await this.send('Your email verification link (expires in 20 mins)', this.text);
  }
};

module.exports = Email;
