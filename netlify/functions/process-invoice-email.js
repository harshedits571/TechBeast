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
    const { to, subject, text, filename, base64Content } = body;

    const smtpEmail = (process.env.SMTP_EMAIL || process.env.VITE_SMTP_EMAIL || body.smtpEmail || 'techbeasthubli@gmail.com').trim();
    const rawPassword = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || body.smtpAppPassword || '';
    const cleanPassword = rawPassword.replace(/\s+/g, '');

    if (!to) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing recipient email address (to).' })
      };
    }

    if (!cleanPassword) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'SMTP_APP_PASSWORD is not configured in Netlify Environment Variables. Please add SMTP_APP_PASSWORD in your site settings.'
        })
      };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpEmail,
        pass: cleanPassword
      }
    });

    const mailOptions = {
      from: `"Tech Beast Hubli" <${smtpEmail}>`,
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
