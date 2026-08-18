import {X, Printer, FileText} from "lucide-react";

const InvoiceModal = ({order, isOpen, onClose}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.orderItems || [];

  const totalMrpSubtotal = items.reduce((acc, item) => {
    const mrp =
      item.mrp ||
      item.customerBasePrice ||
      item.product?.mrp ||
      item.price ||
      0;
    return acc + mrp * (item.quantity || 1);
  }, 0);

  const totalDiscount = items.reduce((acc, item) => {
    if (item.discountAmount !== undefined && item.discountAmount !== null) {
      return acc + item.discountAmount;
    }
    const base = item.customerBasePrice || item.mrp || item.product?.mrp || 0;
    const price = item.price || 0;
    return acc + (base > price ? (base - price) * (item.quantity || 1) : 0);
  }, 0);

  const taxableAmount = items.reduce((acc, item) => {
    return acc + (item.price || 0) * (item.quantity || 1);
  }, 0);

  const totalGst = items.reduce((acc, item) => acc + (item.gstAmount || 0), 0);
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const grandTotal = order.totalAmount || taxableAmount + totalGst;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 print:p-0 print:bg-white">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl print:shadow-none print:w-full print:max-w-none print:h-auto print:rounded-none border border-slate-200">
        {/* Modal Top Control Header (Screen Only) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Tax Invoice Details</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable View */}
        <div className="p-6 sm:p-10 space-y-6 text-slate-700 bg-white">
          {/* 1. TOP CENTER HEADER - TAX INVOICE & COMPANY DETAILS */}
          <div className="text-center border-b border-slate-200 pb-5 space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-wider uppercase">
              Inventory Management System Inc.
            </h1>
            <p className="text-xs text-slate-500">
              Sant Gadagebaba Campus, Pune Branch, Maharashtra
            </p>
            <p className="text-xs text-slate-500 font-medium pt-0.5">
              <span>
                GSTIN:{" "}
                <strong className="text-slate-700">27AAAAA0000A1Z5</strong>
              </span>
              <span className="mx-2">|</span>
              <span>
                Support:{" "}
                <strong className="text-slate-700">
                  support@inventory.com
                </strong>
              </span>
            </p>
            <p className="text-base font-bold text-slate-900">TAX INVOICE</p>
          </div>

          {/* 2. BILLED TO & INVOICE REFERENCE DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 print:bg-transparent print:p-0 print:border-none">
            {/* Customer Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-200 pb-1">
                Billed To (Customer Details):
              </h3>
              <p className="text-base font-bold text-slate-900">
                {order.customer?.customerName || "Akash Kathole"}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                <b>Phone:</b> {order.customer?.phone || "9898767893"}
              </p>
              <p className="text-xs text-slate-600">
                <b>Email:</b> {order.customer?.email || "rahul@gmail.com"}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                <b>Address:</b>{" "}
                {order.customer?.landmark ? `${order.customer.landmark}, ` : ""}
                {order.customer?.city || "Near pmt Bus Stop, pune"},{" "}
                {order.customer?.state || "MAHARASHTRA"}{" "}
                {order.customer?.pincode
                  ? `- ${order.customer.pincode}`
                  : "- 432111"}
              </p>
            </div>

            {/* Invoice Reference Info */}
            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Invoice Reference
                </h3>
                <p className="text-xl font-black text-blue-600">
                  #INV-{order.id}
                </p>
              </div>

              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <p className="flex justify-between sm:justify-end gap-2">
                  <span className="text-slate-400">Date:</span>
                  <span className="font-semibold text-slate-800">
                    {order.orderDate || "N/A"}
                  </span>
                </p>
                <p className="flex justify-between sm:justify-end gap-2 items-center">
                  <span className="text-slate-400">Order Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase">
                    {order.status || "PENDING"}
                  </span>
                </p>
                <p className="flex justify-between sm:justify-end gap-2 items-center">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="text-emerald-700 font-bold uppercase">
                    {order.paymentStatus || "PAID"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-slate-900 font-bold text-xs uppercase">
                  <th className="p-3 text-center">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Base Price</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-right">GST %</th>
                  <th className="p-3 text-right">GST Amt</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.length > 0 ? (
                  items.map((item, index) => {
                    const prodName =
                      item.product?.productName ||
                      item.productName ||
                      "Product Item";
                    const qty = item.quantity || 1;
                    const basePrice =
                      item.customerBasePrice ||
                      item.mrp ||
                      item.product?.customerPrice ||
                      item.price ||
                      0;
                    const sellingPrice = item.price || 0;
                    const discountAmt =
                      item.discountAmount !== undefined &&
                      item.discountAmount !== null
                        ? item.discountAmount
                        : basePrice > sellingPrice
                          ? (basePrice - sellingPrice) * qty
                          : 0;
                    const discountPct =
                      item.customerDiscountPercentage ||
                      (basePrice > sellingPrice && basePrice > 0
                        ? ((basePrice - sellingPrice) / basePrice) * 100
                        : 0);
                    const gstPct =
                      item.gstPercentage !== undefined
                        ? item.gstPercentage
                        : item.product?.gstPercentage || 0;
                    const gstAmt = item.gstAmount || 0;
                    const lineTotal =
                      item.totalPrice || sellingPrice * qty + gstAmt;

                    return (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="p-3 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {prodName}
                        </td>
                        <td className="p-3 text-center font-medium">{qty}</td>
                        <td className="p-3 text-right text-slate-500">
                          ₹{basePrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-emerald-600 font-semibold">
                          {discountAmt > 0
                            ? `-₹${discountAmt.toFixed(2)} (${discountPct.toFixed(0)}%)`
                            : "₹0.00"}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-800">
                          ₹{sellingPrice.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {gstPct}%
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          ₹{gstAmt.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹{lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="p-6 text-center text-slate-400 italic"
                    >
                      No order items configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
            <div className="w-full sm:w-1/2 space-y-2 text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-transparent print:p-0 print:border-none">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Terms & Notes:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Goods once sold are subject to store return policies.</li>
                <li>This invoice includes applicable GST rates.</li>
                <li>Calculations account for line-item discount rates.</li>
              </ul>
            </div>

            <div className="w-full sm:w-1/2 space-y-2.5 text-xs sm:text-sm font-medium">
              <div className="flex justify-between text-slate-600">
                <span>Total Base Subtotal:</span>
                <span className="font-semibold">
                  ₹{totalMrpSubtotal.toFixed(2)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Total Discount Savings:</span>
                  <span>- ₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-semibold">
                  ₹{taxableAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>CGST Subtotal:</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>SGST Subtotal:</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-3 text-slate-900">
                <span>Grand Total (Incl. Taxes):</span>
                <span className="text-blue-700 text-lg">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-slate-400 border-t border-slate-200 pt-6 space-y-1">
            <p className="font-semibold text-slate-600">
              Thank you for your business!
            </p>
            <p>
              This is a computer-generated tax invoice and requires no physical
              signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
