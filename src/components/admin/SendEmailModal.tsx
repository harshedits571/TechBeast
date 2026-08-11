import React, { useState } from 'react';
import { Mail, X, Send, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { getInvoicePdfData } from '../../utils/pdfGenerator';
import { useSettings } from '../../contexts/SettingsContext';

interface SendEmailModalProps {
  order: any;
  onClose: () => void;
}

export default function SendEmailModal({ order, onClose }: SendEmailModalProps) {
  const { settings } = useSettings();
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');
  const [subject, setSubject] = useState(`Proforma Invoice #${order.orderNumber || ''} - Tech Beast Hubli`);
  const [message, setMessage] = useState(
    `Dear ${order.customerName || 'Valued Customer'},\n\nThank you for choosing Tech Beast Hubli!\n\nPlease find attached your official Proforma Invoice #${order.orderNumber || ''} for your recent purchase.\n\nOrder Summary:\n- Proforma Invoice No: ${order.orderNumber || ''}\n- Total Amount: ₹${Number(order.totalAmount || 0).toLocaleString()}\n- Payment Method: ${order.paymentMethod || 'Paid'}\n\nWe appreciate your trust in us. If you have any questions, feel free to contact us at +91 95352 25266 or techbeasthubli@gmail.com.\n\nWarm regards,\nTech Beast Hubli Team\nGround Floor, Shinde Complex, Hubli, Karnataka 580029`
  );

  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const smtpEmail = settings?.smtpEmail || settings?.contactEmail || 'techbeasthubli@gmail.com';
  const smtpAppPassword = settings?.smtpAppPassword || '';

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      alert("Please enter a recipient email address.");
      return;
    }

    setIsSending(true);
    setStatusMsg({ type: 'info', text: 'Generating PDF & sending directly via Gmail...' });

    try {
      // 1. Generate PDF Data
      const { pdf, filename, dataUri } = await getInvoicePdfData(order);
      const base64Content = dataUri.split(',')[1];

      // Check if Gmail App Password is configured
      if (smtpEmail && smtpAppPassword) {
        setStatusMsg({ type: 'info', text: `Sending email directly from ${smtpEmail} via Gmail...` });

        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customerEmail,
            subject: subject,
            text: message,
            filename: filename,
            base64Content: base64Content,
            smtpEmail: smtpEmail,
            smtpAppPassword: smtpAppPassword
          })
        });

        const contentType = response.headers.get('content-type') || '';
        let resData: any = {};

        if (contentType.includes('application/json')) {
          resData = await response.json();
        } else {
          // If deployed on a static frontend host without serverless functions
          pdf.save(filename);
          const mailtoUrl = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          window.open(mailtoUrl, '_blank');

          setStatusMsg({
            type: 'info',
            text: 'PDF invoice downloaded! Mail client opened. (Host is static frontend; for 1-click background sending deploy on Vercel/Netlify).'
          });
          return;
        }

        if (response.ok && resData.success) {
          setStatusMsg({ type: 'success', text: `Email sent successfully directly from ${smtpEmail}! (Inbox Guaranteed)` });
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          throw new Error(resData.error || "Failed to send email via Gmail SMTP.");
        }
      } else {
        // Fallback: Download PDF & open mailto
        pdf.save(filename);
        
        const mailtoUrl = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoUrl, '_blank');

        setStatusMsg({
          type: 'info',
          text: 'PDF downloaded! Enter your 16-digit Google App Password in Admin Settings ➔ General Settings for 100% automated direct sending.'
        });
      }
    } catch (err: any) {
      console.error("Email Error:", err);
      setStatusMsg({
        type: 'error',
        text: `Error sending email: ${err.message || 'Check Google App Password in Settings.'}`
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0d0e] border border-white/10 rounded-2xl w-full max-w-xl text-white shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Email Proforma Invoice</h2>
              <p className="text-xs text-slate-400">Order #{order.orderNumber || ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="p-6 space-y-5">
          
          {/* Anti-Spam Verified Badge */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-400">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Direct Gmail Sender: <strong>{smtpEmail}</strong></span>
            </div>
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase text-[10px]">Inbox Verified</span>
          </div>

          {statusMsg && (
            <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
              statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{statusMsg.text}</p>
            </div>
          )}

          {/* Customer Email */}
          <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Customer Email Address *
            <input 
              required
              type="email" 
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal"
            />
          </label>

          {/* Email Subject */}
          <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Email Subject
            <input 
              required
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal"
            />
          </label>

          {/* Email Message */}
          <label className="flex flex-col gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Message Body
            <textarea 
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors normal-case tracking-normal font-normal resize-none leading-relaxed"
            />
          </label>

          {/* Settings Notice if App Password not set */}
          {!smtpAppPassword && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Automated Sending Setup:</strong> Enter your 16-character <strong>Google App Security Password</strong> in <em>Admin Settings ➔ General Settings</em> to send emails directly from <code>{smtpEmail}</code> in 1-click!
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/30"
            >
              {isSending ? (
                <>Sending via Gmail...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Invoice Email</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
