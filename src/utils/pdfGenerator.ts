import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

export const generateBulkInvoices = async (
  startDate: string, 
  endDate: string, 
  filters: {
    paymentFilter: string;
    fulfillmentFilter: string;
    typeFilter: string;
    searchTerm: string;
    activeTab: string;
  },
  onProgress: (msg: string) => void
) => {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    onProgress('Fetching orders...');

    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', start.toISOString()),
      where('createdAt', '<=', end.toISOString())
    );
    
    const snap = await getDocs(q);
    let orders = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

    // Apply UI Filters
    orders = orders.filter(order => {
      // Tab filtering
      if (filters.activeTab === 'Pending payment' && !['PENDING'].includes(order.paymentStatus?.toUpperCase())) return false;
      if (filters.activeTab === 'Unfulfilled' && !['UNFULFILLED'].includes(order.fulfillmentStatus?.toUpperCase())) return false;
      if (filters.activeTab === 'Completed' && !['COMPLETED', 'FULFILLED'].includes(order.fulfillmentStatus?.toUpperCase())) return false;
      if (filters.activeTab === 'Failed' && !['FAILED'].includes(order.paymentStatus?.toUpperCase())) return false;

      // Search filtering
      if (filters.searchTerm && !(
        order.orderNumber?.toLowerCase().includes(filters.searchTerm.toLowerCase()) || 
        order.customerName?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )) return false;

      // Dropdown filters
      if (filters.paymentFilter && order.paymentStatus?.toUpperCase() !== filters.paymentFilter.toUpperCase()) return false;
      if (filters.fulfillmentFilter && order.fulfillmentStatus?.toUpperCase() !== filters.fulfillmentFilter.toUpperCase()) return false;
      
      // Type filtering (Offline POS vs Online)
      if (filters.typeFilter === 'OFFLINE' && order.deliveryType !== 'In-Store POS') return false;
      if (filters.typeFilter === 'ONLINE' && order.deliveryType === 'In-Store POS') return false;

      return true;
    });

    if (orders.length === 0) {
      alert("No orders found matching the selected filters and date range.");
      onProgress('');
      return;
    }

    onProgress(`Found ${orders.length} orders. Generating PDFs...`);

    const zip = new JSZip();
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      onProgress(`Processing ${i + 1} of ${orders.length}...`);
      
      const subTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0) || order.totalAmount;
      const discountAmount = Math.max(0, subTotal - (order.totalAmount || 0));
      
      let itemsHtml = '';
      if (order.items && order.items.length > 0) {
        itemsHtml = order.items.map((item: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${item.type === 'accessory' ? '#f8fafc' : 'transparent'};">
            <td style="padding: 6px 0;">
              <p style="font-weight: bold; margin: 0; font-size: 14px; color: ${item.type === 'product' ? '#000' : '#334155'};">${item.name}</p>
              <p style="font-size: 10px; color: #64748b; margin: 0;">
                ${item.sku ? `SKU: ${item.sku}` : (item.type === 'product' ? 'Custom Item' : '')}
                ${item.serialNumber ? ` | SN/IMEI: ${item.serialNumber}` : ''}
              </p>
              ${item.conditionNote ? `<p style="font-size: 9px; color: #d97706; margin: 2px 0 0 0;">Condition: ${item.conditionNote}</p>` : ''}
              ${item.type === 'accessory' ? `<p style="font-size: 10px; color: #64748b; margin: 0;">Included Accessory</p>` : ''}
            </td>
            <td style="padding: 6px 0; text-align: center; font-size: 14px;">1</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 14px; color: ${item.price === 0 ? '#059669' : '#000'};">
              ${item.price === 0 ? 'FREE' : `₹${Number(item.price).toLocaleString()}`}
            </td>
          </tr>
        `).join('');
      } else {
        itemsHtml = `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 6px 0; font-weight: bold; font-size: 14px;">Offline POS Sale</td>
            <td style="padding: 6px 0; text-align: center; font-size: 14px;">1</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 14px;">₹${Number(order.totalAmount || 0).toLocaleString()}</td>
          </tr>
        `;
      }

      container.innerHTML = `
        <div style="padding: 40px; color: black; font-family: sans-serif; position: relative;">
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 24px; font-weight: bold; display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <img src="/logo2.jpeg" alt="Logo" style="height: 32px; object-fit: contain; border-radius: 4px;" />
                Tech Beast
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Ground Floor, Shinde Complex, No.183 C Block, Hubballi, Karnataka 580029</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">+91 95352 25266 |techbeasthubli@gmail.com</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0 0 8px 0; font-size: 32px; color: #e2e8f0; letter-spacing: 2px;">Proforma Invoice</h2>
              <p style="margin: 0; font-size: 12px; font-weight: bold;">Invoice No: ${order.orderNumber}</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
              ${order.paymentMethod ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; color: #059669; background: #ecfdf5; display: inline-block; padding: 2px 8px; border-radius: 4px;">Paid via ${order.paymentMethod}</p>` : ''}
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <h3 style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Bill To</h3>
            <p style="margin: 0; font-weight: bold; font-size: 16px;">${order.customerName}</p>
            <p style="margin: 0; font-size: 12px; color: #475569;">Phone: ${order.customerPhone}</p>
            ${order.customerEmail ? `<p style="margin: 0; font-size: 12px; color: #475569;">Email: ${order.customerEmail}</p>` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="border-bottom: 2px solid #0f172a;">
                <th style="padding: 4px 0; text-align: left; font-size: 12px; text-transform: uppercase;">Description</th>
                <th style="padding: 4px 0; text-align: center; font-size: 12px; text-transform: uppercase;">Qty</th>
                <th style="padding: 4px 0; text-align: right; font-size: 12px; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <div style="width: 200px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                <span style="color: #64748b;">Subtotal</span>
                <span style="font-weight: bold;">₹${subTotal.toLocaleString()}</span>
              </div>
              ${discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #059669;">
                <span>Discount</span>
                <span style="font-weight: bold;">- ₹${discountAmount.toLocaleString()}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold;">
                <span>Total</span>
                <span>₹${Number(order.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="flex: 1;">
              <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">TERMS & CONDITIONS</h4>
              <ul style="margin: 0; padding-left: 16px; font-size: 9px; color: #64748b;">
                <li>All second-hand electronics come with a standard 3-month warranty.</li>
                <li>Extended warranty (if purchased) covers internal hardware failures and OS and softwere issues only.</li>
                <li>Physical damage, liquid damage, and short circuits are not covered under warranty.</li>
                <li>Accessories (chargers, Battery,) are covered under warranty.</li>
                <li>Goods once sold cannot be returned or exchanged.</li>
              </ul>
            </div>
            <div style="width: 160px; text-align: center;">
              <div style="height: 40px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
              <p style="margin: 0; font-size: 12px; font-weight: bold;">Authorized Signature</p>
              <p style="margin: 0; font-size: 10px; color: #64748b;">Tech Beast</p>
            </div>
          </div>
        </div>
      `;

      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const safeName = (order.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const safeOrder = (order.orderNumber || `Order-${order.id}`).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeOrder}_${safeName}.pdf`;
      
      zip.file(filename, pdf.output('blob'));
    }

    document.body.removeChild(container);

    onProgress('Creating ZIP file...');
    const content = await zip.generateAsync({ type: 'blob' });
    
    onProgress('Downloading...');
    saveAs(content, `Invoices_${startDate}_to_${endDate}.zip`);
    
    onProgress('');
    
  } catch (error) {
    console.error('Bulk PDF Error:', error);
    alert('An error occurred while generating PDFs. Check console for details.');
    onProgress('');
  }
};

export const generateSingleInvoicePdf = async (order: any, onProgress?: (msg: string) => void) => {
  try {
    if (onProgress) onProgress('Generating PDF...');
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    const subTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0) || order.totalAmount;
    const discountAmount = Math.max(0, subTotal - (order.totalAmount || 0));
    
    let itemsHtml = '';
    if (order.items && order.items.length > 0) {
      itemsHtml = order.items.map((item: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${item.type === 'accessory' ? '#f8fafc' : 'transparent'};">
          <td style="padding: 6px 0;">
            <p style="font-weight: bold; margin: 0; font-size: 14px; color: ${item.type === 'product' ? '#000' : '#334155'};">${item.name}</p>
            <p style="font-size: 10px; color: #64748b; margin: 0;">
              ${item.sku ? `SKU: ${item.sku}` : (item.type === 'product' ? 'Custom Item' : '')}
              ${item.serialNumber ? ` | SN/IMEI: ${item.serialNumber}` : ''}
            </p>
            ${item.conditionNote ? `<p style="font-size: 9px; color: #d97706; margin: 2px 0 0 0;">Condition: ${item.conditionNote}</p>` : ''}
            ${item.type === 'accessory' ? `<p style="font-size: 10px; color: #64748b; margin: 0;">Included Accessory</p>` : ''}
          </td>
          <td style="padding: 6px 0; text-align: center; font-size: 14px;">1</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 14px; color: ${item.price === 0 ? '#059669' : '#000'};">
            ${item.price === 0 ? 'FREE' : `₹${Number(item.price).toLocaleString()}`}
          </td>
        </tr>
      `).join('');
    } else {
      itemsHtml = `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 6px 0; font-weight: bold; font-size: 14px;">Offline POS Sale</td>
          <td style="padding: 6px 0; text-align: center; font-size: 14px;">1</td>
          <td style="padding: 6px 0; text-align: right; font-weight: bold; font-size: 14px;">₹${Number(order.totalAmount || 0).toLocaleString()}</td>
        </tr>
      `;
    }

    container.innerHTML = `
      <div style="padding: 40px; color: black; font-family: sans-serif; position: relative;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 24px; font-weight: bold; display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <img src="/logo2.jpeg" alt="Logo" style="height: 32px; object-fit: contain; border-radius: 4px;" />
              Tech Beast
            </div>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Ground Floor, Shinde Complex, No.183 C Block, Hubballi, Karnataka 580029</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">+91 95352 25266 |techbeasthubli@gmail.com</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0 0 8px 0; font-size: 32px; color: #e2e8f0; letter-spacing: 2px;">Proforma Invoice</h2>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Invoice No: ${order.orderNumber}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</p>
            ${order.paymentMethod ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold; color: #059669; background: #ecfdf5; display: inline-block; padding: 2px 8px; border-radius: 4px;">Paid via ${order.paymentMethod}</p>` : ''}
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Bill To</h3>
          <p style="margin: 0; font-weight: bold; font-size: 16px;">${order.customerName}</p>
          <p style="margin: 0; font-size: 12px; color: #475569;">Phone: ${order.customerPhone}</p>
          ${order.customerEmail ? `<p style="margin: 0; font-size: 12px; color: #475569;">Email: ${order.customerEmail}</p>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 2px solid #0f172a;">
              <th style="padding: 4px 0; text-align: left; font-size: 12px; text-transform: uppercase;">Description</th>
              <th style="padding: 4px 0; text-align: center; font-size: 12px; text-transform: uppercase;">Qty</th>
              <th style="padding: 4px 0; text-align: right; font-size: 12px; text-transform: uppercase;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
          <div style="width: 200px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
              <span style="color: #64748b;">Subtotal</span>
              <span style="font-weight: bold;">₹${subTotal.toLocaleString()}</span>
            </div>
            ${discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #059669;">
              <span>Discount</span>
              <span style="font-weight: bold;">- ₹${discountAmount.toLocaleString()}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: bold;">
              <span>Total</span>
              <span>₹${Number(order.totalAmount || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="flex: 1;">
            <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold;">TERMS & CONDITIONS</h4>
            <ul style="margin: 0; padding-left: 16px; font-size: 9px; color: #64748b;">
              <li>All second-hand electronics come with a standard 3-month warranty.</li>
              <li>Extended warranty (if purchased) covers internal hardware failures and OS and softwere issues only.</li>
              <li>Physical damage, liquid damage, and short circuits are not covered under warranty.</li>
              <li>Accessories (chargers, Battery,) are covered under warranty.</li>
              <li>Goods once sold cannot be returned or exchanged.</li>
            </ul>
          </div>
          <div style="width: 160px; text-align: center;">
            <div style="height: 40px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Authorized Signature</p>
            <p style="margin: 0; font-size: 10px; color: #64748b;">Tech Beast</p>
          </div>
        </div>
      </div>
    `;

    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const safeName = (order.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const safeOrder = (order.orderNumber || `Order-${order.id}`).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeOrder}_${safeName}.pdf`;
    
    pdf.save(filename);

    document.body.removeChild(container);
    if (onProgress) onProgress('');
    return true;
    
  } catch (error) {
    console.error('Single PDF Error:', error);
    alert('An error occurred while generating PDF.');
    if (onProgress) onProgress('');
    return false;
  }
};
