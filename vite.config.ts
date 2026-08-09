import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import nodemailer from 'nodemailer';

function emailMiddlewarePlugin(): Plugin {
  return {
    name: 'email-middleware',
    configureServer(server) {
      server.middlewares.use('/api/send-email', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body);
            const { to, subject, text, filename, base64Content, smtpEmail, smtpAppPassword } = data;

            if (!to || !smtpEmail || !smtpAppPassword) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing required email credentials or recipient address.' }));
              return;
            }

            // Clean app password (remove spaces)
            const cleanPassword = smtpAppPassword.replace(/\s+/g, '');

            // Create Gmail Transporter
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: smtpEmail.trim(),
                pass: cleanPassword
              }
            });

            // Email Options
            const mailOptions: any = {
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, message: 'Email sent successfully directly via Gmail!' }));

          } catch (err: any) {
            console.error('SMTP Email Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Failed to send email via Gmail SMTP.' }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), emailMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
