import React, { useState } from 'react';
import { Printer, X, MessageCircle, Mail } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { shareInvoiceViaWhatsApp } from '../../utils/pdfGenerator';
import SendEmailModal from './SendEmailModal';

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const { settings } = useSettings();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = async () => {
    setIsSharing(true);
    await shareInvoiceViaWhatsApp(order);
    setIsSharing(false);
  };

  const subTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0) || order.totalAmount;
  const discountAmount = Math.max(0, subTotal - (order.totalAmount || 0));

  const regularItems = order.items?.filter((item: any) => item.type !== 'accessory') || [];
  const accessories = order.items?.filter((item: any) => item.type === 'accessory') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-10 print:static print:block print:p-0 print:pt-0 print:bg-white overflow-y-auto">
      <div className="bg-white min-h-[500px] print:min-h-[95vh] print:flex print:flex-col w-full max-w-4xl text-black p-8 shadow-2xl relative print:shadow-none print:p-0 print:m-0 mb-20 rounded-2xl print:rounded-none">

        {/* Controls - Hidden on Print */}
        <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
          <button 
            onClick={handleWhatsApp} 
            disabled={isSharing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <MessageCircle className="h-4 w-4" /> {isSharing ? 'Sharing...' : 'WhatsApp'}
          </button>
          <button 
            onClick={() => setIsEmailModalOpen(true)} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors shadow-sm"
          >
            <Mail className="h-4 w-4" /> Email Invoice
          </button>
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors shadow-sm">
            <Printer className="h-4 w-4" /> Print
          </button>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isEmailModalOpen && (
          <SendEmailModal order={order} onClose={() => setIsEmailModalOpen(false)} />
        )}

        <div className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-start mt-8 print:mt-0 print:pb-4 print:mb-4">
          <div>
            <div className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <img src="/logo2.jpeg" alt="Store Logo" className="h-10 object-contain rounded" />
              {settings?.storeName || 'Tech Beast'}
            </div>
            <p className="text-sm text-slate-500">Ground Floor, Shinde Complex,</p>
            <p className="text-sm text-slate-500">No.183 C Block, Hubballi, Karnataka 580029</p>
            <p className="text-sm text-slate-500">{settings?.supportPhone || '+91 95352 25266'} | {settings?.contactEmail || 'techbeasthubli@gmail.com'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl print:text-xl font-bold text-slate-200 tracking-widest mb-4">Proforma Invoice</h2>
            <p className="text-sm font-bold text-slate-700">Invoice No: {order.orderNumber}</p>
            <p className="text-sm text-slate-500">Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
            {order.paymentMethod && (
              <p className="text-sm font-bold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">Paid via {order.paymentMethod}</p>
            )}
          </div>
        </div>

        <div className="mb-12 print:mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 print:mb-1 print:pb-1">Bill To</h3>
          <p className="font-bold text-lg print:text-base">{order.customerName}</p>
          <p className="text-sm print:text-xs text-slate-600">Phone: {order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm print:text-xs text-slate-600">Email: {order.customerEmail}</p>}
        </div>

        <table className="w-full text-left mb-12 print:mb-4 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest">Description</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {regularItems.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-4 print:py-1.5">
                  <p className="font-semibold print:text-sm text-black">{item.name}</p>
                  <p className="text-xs text-slate-500 print:text-[10px]">
                    {item.sku ? `SKU: ${item.sku}` : 'Custom Item'}
                    {item.serialNumber && ` | SN: ${item.serialNumber}`}
                  </p>
                  {item.conditionNote && (
                    <p className="text-xs text-amber-600 print:text-[9px] mt-0.5">Condition: {item.conditionNote}</p>
                  )}
                </td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className={`py-4 print:py-1.5 text-right font-semibold print:text-sm ${item.price === 0 ? 'text-emerald-600' : ''}`}>
                  {item.price === 0 ? 'FREE' : `₹${Number(item.price).toLocaleString()}`}
                </td>
              </tr>
            ))}
            {accessories.length > 0 && (
              <tr className="border-b border-slate-200 bg-slate-50/50 print:bg-transparent">
                <td className="py-4 print:py-1.5">
                  <p className="font-semibold print:text-sm text-slate-700">Complementary Accessories Combo</p>
                  <p className="text-xs text-slate-500 print:text-[10px] mt-1 pr-4 leading-relaxed">
                    Includes: {accessories.map((a: any) => a.name).join(', ')}
                  </p>
                  <p className="text-xs text-slate-400 print:text-[9px] mt-0.5">Included Free Accessories</p>
                </td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm text-emerald-600">FREE</td>
              </tr>
            )}
            {(!order.items || order.items.length === 0) && (
              <tr className="border-b border-slate-200">
                <td className="py-4 print:py-1.5 font-semibold text-black print:text-sm">Offline POS Sale</td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm">₹{Number(order.totalAmount || 0).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 print:w-48">
            <div className="flex justify-between py-2 print:py-1 border-b border-slate-200 text-sm print:text-xs">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 print:py-1 border-b border-slate-200 text-sm print:text-xs text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-4 print:py-2 text-xl print:text-base font-bold">
              <span>Total</span>
              <span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 print:mt-auto border-t border-slate-200 pt-8 print:pt-4 flex flex-col md:flex-row print:flex-row justify-between items-end gap-8 print:gap-4">
          <div className="flex-1">
            <h4 className="text-sm print:text-xs font-bold text-slate-700 mb-2 print:mb-1 uppercase tracking-wider">Terms & Conditions</h4>
            <ul className="text-xs print:text-[9px] text-slate-500 list-disc pl-4 space-y-1 print:space-y-0 text-left">
              <li>All second-hand electronics come with a standard 3-month warranty.</li>
              <li>Extended warranty (if purchased) covers internal hardware failures and OS and softwere issues only.</li>
              <li>Physical damage, liquid damage, and short circuits are not covered under warranty.</li>
              <li>Accessories (chargers, Battery,) are covered under warranty.</li>
              <li>Goods once sold cannot be returned or exchanged.</li>
            </ul>
          </div>

          <div className="w-48 print:w-40 text-center mt-8 md:mt-0 print:mt-0 shrink-0">
            <div className="h-16 print:h-10 border-b border-slate-400 mb-2 print:mb-1"></div>
            <p className="text-sm print:text-xs font-bold text-slate-700">Authorized Signature</p>
            <p className="text-xs print:text-[10px] text-slate-500">Tech Beast</p>
          </div>
        </div>
      </div>
    </div>
  );
}
