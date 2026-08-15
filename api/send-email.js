import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, filename, base64Content } = req.body || {};

    // Get email & app password securely from Server Environment Variables first, with fallback to request payload
    const smtpEmail = (process.env.SMTP_EMAIL || process.env.VITE_SMTP_EMAIL || req.body?.smtpEmail || 'techbeasthubli@gmail.com').trim();
    const rawPassword = process.env.SMTP_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || req.body?.smtpAppPassword || '';
    const cleanPassword = rawPassword.replace(/\s+/g, '');

    if (!to) {
      return res.status(400).json({ error: 'Missing recipient email address (to).' });
    }

    if (!cleanPassword) {
      return res.status(500).json({
        error: 'SMTP_APP_PASSWORD is not configured in Vercel Environment Variables. Please add SMTP_APP_PASSWORD to your Vercel project settings.'
      });
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
    return res.status(200).json({ success: true, message: 'Email sent successfully via Gmail SMTP' });
  } catch (err) {
    console.error('Vercel API Send Email Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email via Gmail SMTP.' });
  }
}
