const sendEmail = require("../utils/sendEmail");
const generateHTML = require("../utils/generateHTML");
const {
  REPORT_CHAT_TYPE,
  REPORT_HANGOUT_TYPE,
  REPORT_REQUEST_TYPE,
  REPORT_USER_TYPE,
  ADMIN,
  SUPER_ADMIN,
  REPORT_EVENT_TYPE
} = require("../utils/constants");

class EmailController {
  adminVerificationEmail = async (token, emailAddress) => {
    const adminUrl =  process.env.ADMIN_URL;
    const verifyLink =  process.env.ADMIN_VERIFY ;
    const loginLink =  process.env.ADMIN_LOGIN ;

    const html = generateHTML({
      link: adminUrl,
      emailTitle: "Verify Your Admin Account",
      emailSubTitle: "Tap the button below to verify your email address.",
      btnText: "Verify Account",
      btnLink: verifyLink + token,
      belowText: "You can login from here:",
      belowLink: loginLink,
      footerNote: `You received this email because you were added as an admin on ${process.env.APP_NAME}. If you did not initiate this action, please ignore this email.`,
      footerLink: process.env.APP_NAME
    });
    await sendEmail({
      email: emailAddress,
      subject: `${process.env.APP_NAME} admin account verification`,
      html: html
    });
  };

  adminForgotPasswordEmail = async (token, emailAddress) => {
    const forgotLink = process.env.ADMIN_FORGOT_PASS;
    const loginLink = process.env.ADMIN_LOGIN;

    const html = generateHTML({
      emailTitle: "Reset your admin account password",
      emailSubTitle: "Tap the button below to reset your account password.",
      btnText: "Reset Password",
      btnLink: forgotLink + token,
      belowText: "You can login from here:",
      belowLink: loginLink,
      footerNote: `You are receiving this email because a request to reset the password for your ${process.env.APP_NAME} admin account has been initiated. If you did not initiate this action, please disregard this message.`
    });
    await sendEmail({
      email: emailAddress,
      subject: `${process.env.APP_NAME} reset admin account password`,
      html: html
    });
  };

  userVerificationEmail = async (code, emailAddress) => {

    const html = generateHTML({
      link: process.env.LANDING_URL,
      emailTitle: "Verify Your user Account",
      emailSubTitle: "Use the code below to verify your email address.",
      btnText: code,
      belowText: "Visit our website:",
      belowLink: process.env.LANDING_URL,
      footerNote: `You received this email because you have registered on ${process.env.APP_NAME}. If you did not initiate this action, please ignore this email.`,
      footerLink: process.env.APP_NAME
    });
    await sendEmail({
      email: emailAddress,
      subject: `${process.env.APP_NAME} account verification`,
      html: html
    });
  };

  userResetPasswordEmail = async (emailAddress, code) => {

    const html = generateHTML({
      link: process.env.LANDING_URL,
      emailTitle: "Forgot Password Account",
      emailSubTitle: "Use the code below to reset your email password.",
      btnText: code,
      belowText: "Visit our website:",
      belowLink: process.env.LANDING_URL,
      footerNote: `You received this email because you have registered on ${process.env.APP_NAME}. If you did not initiate this action, please ignore this email.`,
      footerLink: process.env.APP_NAME
    });
    await sendEmail({
      email: emailAddress,
      subject: `${process.env.APP_NAME} password Reset`,
      html: html
    });
  };

  userForgotPasswordEmail = async (code, emailAddress) => {
    const html = generateHTML({
      emailTitle: `Reset your ${process.env.APP_NAME} account password`,
      emailSubTitle: "Use the code below to reset your account password.",
      btnText: code,
      footerNote: `You are receiving this email because a request to reset the password for your ${process.env.APP_NAME} account has been initiated. If you did not initiate this action, please disregard this message.`
    });
    await sendEmail({
      email: emailAddress,
      subject: `${process.env.APP_NAME} reset account password`,
      html: html
    });
  };

}

module.exports = new EmailController();
