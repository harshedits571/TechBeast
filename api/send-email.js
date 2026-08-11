import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, text, filename, base64Content, smtpEmail, smtpAppPassword } = req.body;

    if (!to || !smtpEmail || !smtpAppPassword) {
      return res.status(400).json({ error: 'Missing required email credentials or parameters.' });
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
    return res.status(200).json({ success: true, message: 'Email sent successfully via Gmail SMTP' });
  } catch (err) {
    console.error('Vercel API Send Email Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email via Gmail SMTP.' });
  }
}
