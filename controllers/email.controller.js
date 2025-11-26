const sendEmail = require("../utils/sendEmail");
const generateHTML = require("../utils/generateHTML");
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

  reportEmailToAdmin = async (emailAddress, ticket) => {
    const html = generateHTML({
      emailTitle: `A New Ticket Has Been Submitted for ${ticket.stadium.stadiumName}`,
      emailSubTitle: `Ticket reported in the ${ticket.area} area`,
      btnText: "View Ticket Details",
      btnLink: process.env.LANDING_URL + "ticket/" + ticket._id,
      belowText: "View All Tickets:",
      belowLink: process.env.LANDING_URL + "tickets",
      footerNote: `Ticket Submitted by ${ticket.createdBy.firstName} ${ticket.createdBy.lastName} for ${ticket.stadium.stadiumName} in ${ticket.area} area.`,
      footerLink: process.env.APP_NAME
    });
    await sendEmail({
      email: emailAddress,
      subject: `A New Ticket Submitted`,
      html: html
    })
  }

  reportEmailToUser = async (emailAddress, ticket) => {
    const html = generateHTML({
      emailTitle: "Your Ticket Has Been Successfully Submitted",
      emailSubTitle: `Thank you for submitting a ticket for ${ticket.stadium.stadiumName}!`,
      belowText: "View Your Ticket:",
      btnText: "View Ticket Details",
      btnLink: process.env.LANDING_URL + "ticket/" + ticket._id,
      belowText: "View All Your Tickets",
      belowLink: process.env.LANDING_URL + "tickets/my-tickets",
      footerNote: `Thank you for reporting this issue. Our team will review your ticket and follow up if necessary.`,
      footerLink: process.env.APP_NAME
    });
    await sendEmail({
      email: emailAddress,
      subject: `Ticket Successfully Submitted`,
      html: html
    })
  }

}

module.exports = new EmailController();
