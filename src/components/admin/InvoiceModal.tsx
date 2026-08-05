import React from 'react';
import { Printer, X } from 'lucide-react';

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
}

export default function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const subTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0) || order.totalAmount;
  const discountAmount = Math.max(0, subTotal - (order.totalAmount || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:static print:block print:p-0 print:bg-white overflow-y-auto">
      <div className="bg-white min-h-[800px] print:min-h-0 w-full max-w-4xl text-black p-8 shadow-2xl relative print:shadow-none print:p-0 print:m-0 my-8 rounded-2xl print:rounded-none">
        
        {/* Controls - Hidden on Print */}
        <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b-2 border-slate-200 pb-8 mb-8 flex justify-between items-start mt-8 print:mt-0">
          <div>
            <div className="text-3xl font-bold tracking-tight flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-lg">TB</div>
              Tech Beast
            </div>
            <p className="text-sm text-slate-500">123 Tech Avenue, Silicon Valley, CA</p>
            <p className="text-sm text-slate-500">+1 (555) 123-4567 | support@techbeast.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-slate-200 uppercase tracking-widest mb-4">INVOICE</h2>
            <p className="text-sm font-bold text-slate-700">Invoice No: {order.orderNumber}</p>
            <p className="text-sm text-slate-500">Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">Bill To</h3>
          <p className="font-bold text-lg">{order.customerName}</p>
          <p className="text-sm text-slate-600">Phone: {order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm text-slate-600">Email: {order.customerEmail}</p>}
        </div>

        <table className="w-full text-left mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 font-bold text-sm uppercase tracking-widest">Description</th>
              <th className="py-3 font-bold text-sm uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 font-bold text-sm uppercase tracking-widest text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item: any, idx: number) => (
              <tr key={idx} className={`border-b border-slate-200 ${item.type === 'accessory' ? 'bg-slate-50/50' : ''}`}>
                <td className="py-4">
                  <p className={`font-semibold ${item.type === 'product' ? 'text-black' : 'text-slate-700'}`}>{item.name}</p>
                  {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
                  {item.type === 'accessory' && <p className="text-xs text-slate-500">Included Accessory</p>}
                </td>
                <td className="py-4 text-center">1</td>
                <td className={`py-4 text-right font-semibold ${item.price === 0 ? 'text-emerald-600' : ''}`}>
                  {item.price === 0 ? 'FREE' : `₹${Number(item.price).toLocaleString()}`}
                </td>
              </tr>
            ))}
            {(!order.items || order.items.length === 0) && (
              <tr className="border-b border-slate-200">
                <td className="py-4 font-semibold text-black">Offline POS Sale</td>
                <td className="py-4 text-center">1</td>
                <td className="py-4 text-right font-semibold">₹{Number(order.totalAmount || 0).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-slate-200 text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{subTotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200 text-sm text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">- ₹{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-4 text-xl font-bold">
              <span>Total</span>
              <span>₹{Number(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center border-t border-slate-200 pt-8">
          <p className="text-sm font-bold text-slate-700 mb-1">Thank you for your business!</p>
          <p className="text-xs text-slate-500">All electronics come with a standard testing warranty. Accessories are not covered under warranty.</p>
        </div>
      </div>
    </div>
  );
}
