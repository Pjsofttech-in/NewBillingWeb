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
