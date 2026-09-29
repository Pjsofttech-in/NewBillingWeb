import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {getProductBatches} from "../../api/productApi";
import {fetchAttributesByProductType} from "../../api/attributeApi";

const ProductDetailsModal = ({isOpen, product, onClose}) => {
  const {data: history = [], isLoading: historyLoading, isError: historyError, error: historyErrorObj, refetch: refetchHistory} = useQuery({
    queryKey: ["productBatches", product?.id],
    queryFn: () => getProductBatches(product.id),
    enabled: Boolean(isOpen && product?.id),
  });

  const {data: attributes = []} = useQuery({
    queryKey: ["attributes", product?.productType?.id],
    queryFn: () => fetchAttributesByProductType(product.productType.id),
    enabled: Boolean(isOpen && product?.productType?.id),
  });

  const stockStatus = useMemo(() => {
    const stock = product?.stock ?? 0;
    if (stock <= 0)
      return {
        label: "Out of stock",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    if (stock <= 10)
      return {
        label: "Low stock",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    return {
      label: "In stock",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }, [product]);

  if (!isOpen || !product) return null;

  const mrp = product.mrp ?? 0;
  const storePrice = product.storePrice ?? 0;
  const customerPrice = product.customerPrice ?? 0;
  const stock = product.stock ?? 0;
  const totalAmount = product.totalAmount ?? stock * customerPrice;
  const gst = product.totalGstPercentage ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700">
                #{product.id}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {product.productName}
              </h2>
              <span
                className={`text-xs font-bold px-2 py-1 rounded border ${stockStatus.className}`}
              >
                {stockStatus.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete product, pricing, GST and stock information from the
              backend.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Product Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Info
                label="Product Type"
                value={product.productType?.typeName || "N/A"}
              />
              <Info
                label="Brand"
                value={product.brand?.brandName || "N/A"}
              />
              <Info
                label="Vendor"
                value={product.vendor?.vendorName || "N/A"}
              />
              <Info
                label="Unit Type"
                value={
                  product.unitType?.unitType ||
                  product.unitType?.unitName ||
                  "N/A"
                }
              />
              <Info
                label="Added Date"
                value={product.productAddedDate || "N/A"}
              />
              <Info
                label="Current Stock"
                value={`${stock} ${product.unitType?.unitType || ""}`}
              />
              <Info
                label="Stock Value"
                value={`₹${Number(totalAmount).toLocaleString()}`}
              />
              <Info
                label="Active"
                value={product.active === false ? "No" : "Yes"}
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Pricing</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Info
                label="MRP"
                value={`₹${Number(mrp).toLocaleString()}`}
              />
              <Info
                label="Vendor Discount"
                value={`${product.vendorDiscountPercentage ?? 0}%`}
              />
              <Info
                label="Store / Buy Price"
                value={`₹${Number(storePrice).toLocaleString()}`}
              />
              <Info
                label="Actual Product MRP"
                value={`₹${Number(product.productMrp ?? 0).toLocaleString()}`}
              />
              <Info
                label="Customer Price"
                value={`₹${Number(customerPrice).toLocaleString()}`}
              />
              <Info
                label="Margin / Unit"
                value={`₹${Number(customerPrice - storePrice).toLocaleString()}`}
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">GST</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Info
                label="GST Applicable"
                value={product.gstApplicable ? "Yes" : "No"}
              />
              <Info
                label="CGST"
                value={
                  product.applyCgst
                    ? `${product.cgstPercentage ?? 0}%`
                    : "Not applied"
                }
              />
              <Info
                label="SGST"
                value={
                  product.applySgst
                    ? `${product.sgstPercentage ?? 0}%`
                    : "Not applied"
                }
              />
              <Info
                label="UGST"
                value={
                  product.applyUgst
                    ? `${product.ugstPercentage ?? 0}%`
                    : "Not applied"
                }
              />
              <Info
                label="IGST"
                value={
                  product.applyIgst
                    ? `${product.igstPercentage ?? 0}%`
                    : "Not applied"
                }
              />
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-600">
              Total GST: <span className="text-emerald-700">{gst}%</span>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Product Type Attributes
            </h3>
            {attributes.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-50 border rounded-lg p-3">
                No attribute definitions are configured for this product type.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attributes.map((attribute) => (
                  <span
                    key={attribute.id}
                    className="px-2.5 py-1.5 rounded-lg border bg-purple-50 text-purple-800 text-xs font-semibold"
                  >
                    {attribute.name ||
                      attribute.attributeName ||
                      `Attribute #${attribute.id}`}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              The current backend exposes attribute definitions here;
              product-specific attribute values are saved through POST
              /createProductAttributeValue but are not exposed by a GET
              endpoint.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Purchase History
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {history.length} entries
              </span>
            </div>
            {historyLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading purchase history...
              </div>
            ) : historyError ? (
              <div className="py-8 text-center border rounded-lg bg-red-50">
                <p className="text-xs font-semibold text-red-600 mb-1">
                  Failed to load purchase history
                </p>
                <p className="text-[11px] text-slate-500 mb-3">
                  {historyErrorObj?.response?.data?.message || historyErrorObj?.message || "Unknown error"}
                </p>
                <button
                  onClick={() => refetchHistory()}
                  className="text-xs font-semibold text-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 border rounded-lg bg-slate-50">
                No purchase history available.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Batch</th>
                      <th className="p-2 text-center">Initial Qty</th>
                      <th className="p-2 text-center">Available</th>
                      <th className="p-2 text-left">Vendor</th>
                      <th className="p-2 text-right">Buy Price</th>
                      <th className="p-2 text-right">Customer Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="p-2 whitespace-nowrap">
                          {entry.receivedDate || "N/A"}
                        </td>
                        <td className="p-2 font-semibold">
                          {entry.batchNumber || "N/A"}
                        </td>
                        <td className="p-2 text-center">
                          {entry.initialQuantity ?? 0}
                        </td>
                        <td className="p-2 text-center font-bold">
                          {entry.availableQuantity ?? 0}
                        </td>
                        <td className="p-2">
                          {entry.vendor?.vendorName || "N/A"}
                        </td>
                        <td className="p-2 text-right">
                          ₹{Number(entry.purchasePrice ?? 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          ₹{Number(entry.sellingPrice ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Info = ({label, value}) => (
  <div className="border rounded-lg p-2.5 bg-slate-50">
    <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-bold">
      {label}
    </span>
    <span className="block mt-1 text-sm font-semibold text-slate-800 truncate">
      {value}
    </span>
  </div>
);

export default ProductDetailsModal;
