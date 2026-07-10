const generalTemplate = (content: { heading: string; subHeading?: string; text: string }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content?.heading}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-color: #667eea; /* Fallback for email clients that don't support gradients */
          color: #ffffff !important;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #ffffff !important;
        }
        .header p {
          font-size: 16px;
          opacity: 0.9;
          color: #ffffff !important;
        }
        .content {
          padding: 40px 30px;
          color: #333333;
          line-height: 1.6;
        }
        .content p {
          font-size: 15px;
          margin-bottom: 20px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          font-size: 13px;
          color: #666666;
          margin-bottom: 10px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .email-container {
            border-radius: 0;
          }
          .header h1 {
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); background-color: #667eea; color: #ffffff; padding: 40px 30px; text-align: center;">
          <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 10px; color: #ffffff;">${content?.heading || "Welcome"}</h1>
          ${content?.subHeading ? `<p style="font-size: 16px; opacity: 0.9; color: #ffffff; margin: 0;">${content.subHeading}</p>` : ""}
        </div>
        <div class="content">
          <p>${content?.text}</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default generalTemplate;
