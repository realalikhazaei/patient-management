const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

const Email = class {
  constructor(user) {
    this.name = user.name?.split(' ')[0] || 'Dear';
    this.from = process.env.MAILTRAP_FROM;
    this.to = user.email;
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

  async sendTemplate(subject, template, data) {
    const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, { data });
    const text = htmlToText.convert(html);

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    };

    await this.createTransport().sendMail(mailOptions);
  }

  async sendResetPassword(text) {
    await this.send('Your password reset link (expires in 10 mins)', text);
  }

  async sendVerifyEmail(text) {
    await this.send('Your email verification link (expires in 20 mins)', text);
  }

  async sendVisitReminder(visit) {
    await this.sendTemplate('Visit reminder', 'reminder', visit);
  }
};

module.exports = Email;
