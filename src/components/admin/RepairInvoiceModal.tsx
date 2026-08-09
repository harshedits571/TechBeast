import React from 'react';
import { Printer, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface RepairInvoiceModalProps {
  ticket: any;
  onClose: () => void;
}

export default function RepairInvoiceModal({ ticket, onClose }: RepairInvoiceModalProps) {
  const { settings } = useSettings();

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = ticket.parts ? ticket.parts.reduce((sum: number, part: any) => sum + (Number(part.price) || 0) * (Number(part.qty) || 1), 0) : Number(ticket.estimatedCost || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-10 print:static print:block print:p-0 print:pt-0 print:bg-white overflow-y-auto">
      <div className="bg-white min-h-[500px] print:min-h-[85vh] print:flex print:flex-col w-full max-w-4xl text-black p-8 shadow-2xl relative print:shadow-none print:p-0 print:m-0 mb-20 rounded-2xl print:rounded-none">

        {/* Controls - Hidden on Print */}
        <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
          <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition-colors">
            <Printer className="h-4 w-4" /> Print Invoice
          </button>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

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
            <h2 className="text-2xl print:text-xl font-bold text-slate-200 tracking-widest mb-4">Service Invoice</h2>
            <p className="text-sm font-bold text-slate-700">Ticket No: {ticket.ticketNumber || `REP-${ticket.id.slice(0,4).toUpperCase()}`}</p>
            <p className="text-sm text-slate-500">Date: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</p>
            <p className="text-sm font-bold text-blue-600 mt-2 bg-blue-50 inline-block px-2 py-1 rounded">Status: {ticket.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12 print:mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 print:mb-1 print:pb-1">Bill To</h3>
            <p className="font-bold text-lg print:text-base">{ticket.customerName}</p>
            <p className="text-sm print:text-xs text-slate-600">Phone: {ticket.customerPhone}</p>
            {ticket.customerEmail && <p className="text-sm print:text-xs text-slate-600">Email: {ticket.customerEmail}</p>}
          </div>
          <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 print:mb-1 print:pb-1">Device Details</h3>
             <p className="font-bold text-base print:text-sm">{ticket.brand} {ticket.model} ({ticket.deviceType})</p>
             <p className="text-sm print:text-xs text-slate-600">Serial: {ticket.serialNumber}</p>
             {ticket.issue && <p className="text-xs text-slate-500 mt-1 italic">Issue: {ticket.issue}</p>}
          </div>
        </div>

        <table className="w-full text-left mb-12 print:mb-4 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest">Description</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-center">Qty</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-right">Price</th>
              <th className="py-3 print:py-1 font-bold text-sm print:text-xs uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(!ticket.parts || ticket.parts.length === 0) ? (
              <tr className="border-b border-slate-200">
                <td className="py-4 print:py-1.5 font-semibold text-black print:text-sm">General Service & Repair</td>
                <td className="py-4 print:py-1.5 text-center print:text-sm">1</td>
                <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm">₹{Number(ticket.estimatedCost || 0).toLocaleString()}</td>
                <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm">₹{Number(ticket.estimatedCost || 0).toLocaleString()}</td>
              </tr>
            ) : (
              ticket.parts.map((part: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-4 print:py-1.5">
                    <p className="font-semibold text-black print:text-sm">{part.name}</p>
                  </td>
                  <td className="py-4 print:py-1.5 text-center print:text-sm">{part.qty || 1}</td>
                  <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm">₹{Number(part.price || 0).toLocaleString()}</td>
                  <td className="py-4 print:py-1.5 text-right font-semibold print:text-sm">₹{(Number(part.price || 0) * (Number(part.qty) || 1)).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 print:w-48">
            <div className="flex justify-between py-4 print:py-2 text-xl print:text-base font-bold">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-16 print:mt-auto border-t border-slate-200 pt-8 print:pt-4 flex flex-col md:flex-row print:flex-row justify-between items-end gap-8 print:gap-4">
          <div className="flex-1">
            <h4 className="text-sm print:text-xs font-bold text-slate-700 mb-2 print:mb-1 uppercase tracking-wider">Terms & Conditions</h4>
            <ul className="text-xs print:text-[9px] text-slate-500 list-disc pl-4 space-y-1 print:space-y-0 text-left">
              <li>Warranty is applicable only on replaced parts as per manufacturer guidelines.</li>
              <li>No warranty on liquid damage or physically damaged devices after repair.</li>
              <li>Devices not collected within 30 days of completion will be recycled or sold to recover costs.</li>
              <li>Service charges are non-refundable once diagnosis or repair is initiated.</li>
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
