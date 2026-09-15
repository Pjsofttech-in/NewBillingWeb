import {useQuery} from "@tanstack/react-query";
import {getProductBatches} from "../../api/productApi";

const BatchListModal = ({isOpen, product, onClose}) => {
  const {
    data: batches = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["productBatches", product?.id],
    queryFn: () => getProductBatches(product.id),
    enabled: Boolean(isOpen && product?.id),
  });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">
              Purchase History — {product?.productName}
            </h3>
            <p className="text-xs text-slate-500">
              Every purchase/restock is a separate immutable entry with its own
              vendor and prices.
            </p>
          </div>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-4 overflow-auto">
          {isLoading ? (
            <p className="p-8 text-center">Loading batches...</p>
          ) : isError ? (
            <div className="text-center p-8">
              <p>Unable to load batches.</p>
              <button
                onClick={() => refetch()}
                className="text-blue-600 text-sm"
              >
                Retry
              </button>
            </div>
          ) : batches.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No batches found.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-3 text-left">Batch</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Initial Qty</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Vendor MRP</th>
                  <th className="p-3">Vendor Disc.</th>
                  <th className="p-3">Buy Price</th>
                  <th className="p-3">Product MRP</th>
                  <th className="p-3">Customer Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-bold">{b.batchNumber}</td>
                    <td className="p-3">{b.vendor?.vendorName || "N/A"}</td>
                    <td className="p-3 text-center">{b.receivedDate || "-"}</td>
                    <td className="p-3 text-center">{b.initialQuantity}</td>
                    <td className="p-3 text-center font-bold">
                      {b.availableQuantity}
                    </td>
                    <td className="p-3 text-right">
                      ₹{Number(b.vendorMrp || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {Number(b.vendorDiscountPercentage || 0).toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700">
                      ₹{Number(b.purchasePrice || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">
                      ₹{Number(b.productMrp || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      ₹{Number(b.sellingPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export default BatchListModal;
