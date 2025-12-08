const generateHTML = ({
    link = process.env.FRONTEND_URL,
    logo = process.env.LOGO_URL,
    backgroundColor = "#F4F6F8",
    primaryColor = "#0A7F3F",
    secondaryColor = "#ffffff",
    emailTitle,
    emailSubTitle,
    btnText,
    btnLink,
    belowText,
    belowLink,
    footerNote,
    footerLink
}) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Email</title>

      <style>
        body {
          margin: 0;
          padding: 0;
          background: ${backgroundColor};
          font-family: 'Arial', sans-serif;
        }

        .container {
          width: 100%;
          max-width: 600px;
          margin: 30px auto;
          background: ${secondaryColor};
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .logo {
          text-align: center;
          padding: 30px 0;
          background: ${secondaryColor};
        }

        .logo img {
          width: 180px;
        }

        .header {
          padding: 30px 30px 10px;
          border-top: 4px solid ${primaryColor};
        }

        .header h1 {
          margin: 0;
          font-size: 26px;
          color: #222;
          font-weight: bold;
        }

        .content {
          padding: 20px 30px;
          color: #444;
          font-size: 16px;
          line-height: 26px;
        }

        .button-wrapper {
          text-align: center;
          padding: 20px 30px 40px;
        }

        .button {
          background: ${primaryColor};
          color: #fff !important;
          padding: 14px 28px;
          font-size: 16px;
          border-radius: 8px;
          text-decoration: none;
          display: inline-block;
          font-weight: bold;
          transition: 0.2s;
        }

        .button:hover {
          opacity: 0.9;
        }

        .below {
          padding: 0 30px 25px;
          font-size: 15px;
          line-height: 22px;
          color: #444;
        }

        .below a {
          color: ${primaryColor};
          font-weight: bold;
          text-decoration: none;
        }

        .footer {
          text-align: center;
          padding: 20px 30px;
          font-size: 13px;
          color: #777;
        }

        .footer a {
          color: ${primaryColor};
          text-decoration: none;
        }

      </style>
    </head>

    <body>

      <div class="container">

        <div class="logo">
          <a href="${link}" target="_blank">
            <img src="${logo}" alt="Logo">
          </a>
        </div>

        <div class="header">
          <h1>${emailTitle}</h1>
        </div>

        <div class="content">
          <p>${emailSubTitle}</p>
        </div>

        ${
          btnText || btnLink
            ? `
              <div class="button-wrapper">
                ${
                  btnLink
                    ? `<a href="${btnLink}" class="button" target="_blank">${btnText}</a>`
                    : `<div class="button">${btnText}</div>`
                }
              </div>`
            : ""
        }

        ${
          belowText || belowLink
            ? `
            <div class="below">
              ${belowText ? `<p>${belowText}</p>` : ""}
              ${
                belowLink
                  ? `<a href="${belowLink}" target="_blank">${belowLink}</a>`
                  : ""
              }
            </div>`
            : ""
        }

        <div class="content" style="border-top:1px solid #eee; padding-top:20px;">
          <p>Thank you,<br>${process.env.APP_NAME}</p>
        </div>

        <div class="footer">
          <p>${footerNote || ""}</p>
          ${
            footerLink
              ? `<a href="${footerLink}" target="_blank">${footerLink}</a>`
              : ""
          }
        </div>

      </div>

    </body>
    </html>
    `;

    return html;
};

module.exports = generateHTML;