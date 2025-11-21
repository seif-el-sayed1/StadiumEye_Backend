const sgMail = require('@sendgrid/mail');
const ApiError = require('./ApiError');

sgMail.setApiKey(process.env.EMAIL_PASS); 

const sendEmail = async (options) => {
    const msg = {
        to: options.email,
        from: process.env.EMAIL_USER, 
        subject: options.subject,
        text: options.message,
        html: options.html,
        attachments: options.attachment 
    };

    try {
        const info = await sgMail.send(msg);
        console.log(`Email sent to ${options.email}`);
        return info;
    } catch (err) {
        console.error('Email send error:', err);
        throw new ApiError('Unable to send an email, please try again later.', 422);
    }
};

module.exports = sendEmail;
