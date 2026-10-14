import API from "../api/axios";
import {pickParams} from "./queryParams";

// Content-Disposition: attachment; filename="orders_20261007_101500.pdf"
const fileNameFromHeader = (header) => {
  if (!header) return null;

  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* fall through to the plain filename */
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
};

// With responseType "blob" an error body arrives as a Blob too; read the JSON message out of it.
const readErrorMessage = async (error) => {
  const data = error?.response?.data;
  let message = null;

  if (data instanceof Blob) {
    try {
      message = JSON.parse(await data.text())?.message;
    } catch {
      /* not JSON */
    }
  } else {
    message = data?.message;
  }

  message = message || error?.message || "Download failed";
  return String(message).replace(/^\[[^\]]+\]\s*/, ""); // drop the "[RuntimeException] " prefix
};

/**
 * GETs a file from the backend (with the auth header) and saves it in the browser.
 * Throws an Error with a readable message if anything goes wrong.
 */
export const downloadFile = async (url, params, fallbackName) => {
  try {
    const response = await API.get(url, {
      params: pickParams(params, Object.keys(params || {})),
      responseType: "blob",
    });

    const fileName =
      fileNameFromHeader(response.headers?.["content-disposition"]) ||
      fallbackName;

    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    throw new Error(await readErrorMessage(error), { cause: error });
  }
};
