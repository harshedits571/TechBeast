import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

export default function CheckoutSuccess() {
  const location = useLocation();
  const orderNumber = location.state?.orderNumber;

  if (!orderNumber) {
    return <Navigate to="/products" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center md:p-12">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Inquiry Submitted!</h1>
          <p className="text-lg text-slate-600 mb-2">Thank you for sharing your details and showing interest in our products!</p>
          <p className="text-slate-500 mb-8">
            Your inquiry reference number is <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{orderNumber}</span>
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2">What happens next?</h3>
            <p className="text-sm text-slate-600">
              We have successfully received your inquiry. Our team will review your request and get back to you within 24 hours to assist you further.
            </p>
          </div>

          <Link 
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors"
          >
            <ShoppingBag className="h-5 w-5" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
