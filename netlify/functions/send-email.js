const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { to, subject, text, filename, base64Content, smtpEmail, smtpAppPassword } = body;

    if (!to || !smtpEmail || !smtpAppPassword) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required email credentials or parameters.' })
      };
    }

    const cleanPassword = smtpAppPassword.replace(/\s+/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail.trim(),
        pass: cleanPassword
      }
    });

    const mailOptions = {
      from: `"Tech Beast Hubli" <${smtpEmail.trim()}>`,
      to: to.trim(),
      subject: subject || 'Proforma Invoice - Tech Beast Hubli',
      text: text || '',
      attachments: base64Content ? [
        {
          filename: filename || 'Invoice.pdf',
          content: Buffer.from(base64Content, 'base64'),
          contentType: 'application/pdf'
        }
      ] : []
    };

    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Email sent successfully via Gmail SMTP' })
    };
  } catch (err) {
    console.error('Netlify API Send Email Error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to send email via Gmail SMTP.' })
    };
  }
};
