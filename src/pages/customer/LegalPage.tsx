import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, FileText, Truck, RefreshCcw } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const policies = {
  'privacy-policy': {
    title: 'Privacy Policy',
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    lastUpdated: 'August 2026',
    content: (storeName: string, email: string) => `
      Welcome to ${storeName}. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights.
      
      ### 1. The Data We Collect About You
      We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
      * **Identity Data:** includes first name, last name, username or similar identifier.
      * **Contact Data:** includes billing address, delivery address, email address and telephone numbers.
      * **Financial Data:** includes payment card details (processed securely by our payment partners; we do not store full card numbers).
      * **Transaction Data:** includes details about payments to and from you and other details of products and services you have purchased from us.

      ### 2. How We Use Your Personal Data
      We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
      * Where we need to perform the contract we are about to enter into or have entered into with you (e.g., fulfilling an order).
      * Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
      * Where we need to comply with a legal obligation.

      ### 3. Data Security
      We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. 

      ### 4. Your Legal Rights
      Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing.

      **Contact Us:** For any privacy-related questions, please contact us at ${email}.
    `
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions',
    icon: <FileText className="w-6 h-6 text-blue-600" />,
    lastUpdated: 'August 2026',
    content: (storeName: string) => `
      These terms and conditions outline the rules and regulations for the use of ${storeName}'s Website and Services.

      ### 1. Introduction
      By accessing this website we assume you accept these terms and conditions. Do not continue to use ${storeName} if you do not agree to take all of the terms and conditions stated on this page.

      ### 2. Cookies
      We employ the use of cookies. By accessing ${storeName}, you agreed to use cookies in agreement with the ${storeName}'s Privacy Policy.

      ### 3. Intellectual Property Rights
      Unless otherwise stated, ${storeName} and/or its licensors own the intellectual property rights for all material on ${storeName}. All intellectual property rights are reserved. You may access this from ${storeName} for your own personal use subjected to restrictions set in these terms and conditions.

      ### 4. Product Descriptions and Warranties
      We attempt to be as accurate as possible in product descriptions. For new items, standard manufacturer warranties apply. For used/refurbished items, the TechBeast Certified Warranty applies as stated on the product page. Warranty claims are subject to physical verification and void if unauthorized repairs or liquid damage is detected.

      ### 5. Limitation of Liability
      In no event shall ${storeName}, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this website.
    `
  },
  'refund-policy': {
    title: 'Refund & Cancellation Policy',
    icon: <RefreshCcw className="w-6 h-6 text-blue-600" />,
    lastUpdated: 'August 2026',
    content: (storeName: string) => `
      Thank you for shopping at ${storeName}. We strive to ensure you have a rewarding experience while exploring, evaluating, and purchasing our products.

      ### 1. 7-Day Return Window for Defective Items
      For used/refurbished devices, we offer a 7-day return policy exclusively for hardware defects not mentioned prior to sale. The item must be returned in the exact physical condition it was purchased, including all original packaging and accessories.

      ### 2. Brand New Items
      Brand new sealed items can only be returned if the seal remains unbroken. If a new item is defective out of the box, it must be claimed through the official Brand Service Center according to the manufacturer's warranty policies.

      ### 3. Non-Returnable Scenarios
      We do not accept returns for:
      * Change of mind after purchase or delivery.
      * Software-related issues (we provide software support instead).
      * Physical damage, liquid damage, or electrical surges post-delivery.

      ### 4. Cancellation Policy
      Orders can be cancelled free of charge if the cancellation request is made before the item is dispatched. Once dispatched, standard return policies apply and shipping fees may not be refundable.

      ### 5. Refund Processing
      Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed, and a credit will automatically be applied to your credit card or original method of payment, within 5-7 business days.
    `
  },
  'shipping-policy': {
    title: 'Shipping & Delivery Policy',
    icon: <Truck className="w-6 h-6 text-blue-600" />,
    lastUpdated: 'August 2026',
    content: (storeName: string) => `
      At ${storeName}, we are committed to delivering your tech gear safely and promptly.

      ### 1. Order Processing
      All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.

      ### 2. Shipping Rates and Estimates
      Shipping charges for your order will be calculated and displayed at checkout. Standard shipping typically takes 3-7 business days depending on your location. Expedited options may be available at checkout.

      ### 3. In-Store Pickup
      You can skip the shipping fees with free local pickup at our physical store. After placing your order and selecting local pickup at checkout, your order will be prepared and ready for pick up within 1 to 2 business days.

      ### 4. Shipping Insurance & Damage
      All high-value items (laptops, desktops) are shipped with transit insurance. If you receive your order damaged, please contact us within 24 hours of delivery with photos of the damaged packaging and product so we can file a claim with the carrier.

      ### 5. International Shipping
      At this time, we do not ship outside of our primary operating country unless explicitly stated otherwise during the checkout process.
    `
  }
};

export default function LegalPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const { settings } = useSettings();
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (policyId && policies[policyId as keyof typeof policies]) {
      setPolicy(policies[policyId as keyof typeof policies]);
    } else {
      setPolicy(null);
    }
  }, [policyId]);

  if (!policy) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Policy Not Found</h2>
        <p className="mb-4">The legal document you are looking for does not exist or has been moved.</p>
        <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
      </div>
    );
  }

  // Parse markdown-like syntax for basic formatting
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.trim().startsWith('###')) {
        return <h3 key={index} className="text-lg font-bold text-slate-900 mt-8 mb-4">{line.replace('###', '').trim()}</h3>;
      }
      // Bullet points
      if (line.trim().startsWith('*')) {
        let content = line.replace('*', '').trim();
        // Bold text inside bullet
        content = content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
        return <li key={index} className="ml-6 mb-2 list-disc" dangerouslySetInnerHTML={{ __html: content }} />;
      }

      let content = line.trim();
      if (!content) return <br key={index} />;

      // Bold text in normal lines
      content = content.replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
      return <p key={index} className="mb-4" dangerouslySetInnerHTML={{ __html: content }} />;
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            {policy.icon}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {policy.title}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Last Updated: {policy.lastUpdated}
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12 text-slate-600 leading-relaxed">
          {formatContent(policy.content(settings.storeName || 'TechBeast', settings.contactEmail || 'support@techbeast.com'))}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-sm text-slate-500">
          If you have any questions regarding these policies, please contact us at{' '}
          <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline font-medium">
            {settings.contactEmail || 'support@techbeast.com'}
          </a>
        </div>
      </div>
    </div>
  );
}
