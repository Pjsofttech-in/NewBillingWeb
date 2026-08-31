// import API from "./axios";

// // GET /api/v1/invoices/print/{orderId} -> returns a PDF binary stream
// // Fetches the invoice PDF as a Blob so it can be opened in a new tab or downloaded.
// export const fetchInvoicePdfBlob = async (orderId) => {
//   const response = await API.get(`/api/v1/invoices/print/${orderId}`, {
//     responseType: "blob",
//   });
//   return response.data;
// };

// // Opens the generated invoice PDF in a new browser tab.
// export const openInvoicePdf = async (orderId) => {
//   const blob = await fetchInvoicePdfBlob(orderId);
//   const url = window.URL.createObjectURL(blob);
//   window.open(url, "_blank", "noopener,noreferrer");
//   setTimeout(() => window.URL.revokeObjectURL(url), 60000);
// };

// // Downloads the generated invoice PDF to the user's device.
// export const downloadInvoicePdf = async (orderId) => {
//   const blob = await fetchInvoicePdfBlob(orderId);
//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement("a");
//   link.href = url;
//   link.download = `Invoice_${orderId}.pdf`;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   window.URL.revokeObjectURL(url);
// };

import API from "./axios";

export const fetchInvoicePdfBlob = async (orderId) => {
  const response = await API.get(`/api/v1/invoices/print/${orderId}`, {
    responseType: "blob",
  });

  return response.data;
};

export const openInvoicePdf = async (orderId) => {
  const blob = await fetchInvoicePdfBlob(orderId);

  const url = window.URL.createObjectURL(blob);

  window.open(url, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 60000);
};

export const downloadInvoicePdf = async (orderId) => {
  const blob = await fetchInvoicePdfBlob(orderId);

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = `Invoice_${orderId}.pdf`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
};
