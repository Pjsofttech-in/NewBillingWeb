import {useEffect} from "react";
import {useQuery} from "@tanstack/react-query";
import {X} from "lucide-react";
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

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Purchase History — {product?.productName}
            </h3>
            <p className="text-xs text-slate-500">
              Every purchase/restock is a separate immutable entry with its own
              vendor and prices.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <p className="p-8 text-center">Loading batches...</p>
          ) : isError ? (
            <div className="text-center p-8">
              <p>Unable to load batches.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : batches.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No batches found.</p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-blue-400 text-white">
                  <th className="p-3 text-left">Batch</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Received</th>
                  <th className="p-3">Initial qty</th>
                  <th className="p-3">Available</th>
                  <th className="p-3">Product MRP</th>
                  <th className="p-3">Vendor disc.</th>
                  <th className="p-3">Buy price</th>
                  <th className="p-3">Customer price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="p-3 font-bold">{b.batchNumber}</td>
                    <td className="p-3">{b.vendor?.vendorName || "N/A"}</td>
                    <td className="p-3 text-center">{b.receivedDate || "-"}</td>
                    <td className="p-3 text-center">{b.initialQuantity}</td>
                    <td className="p-3 text-center font-bold">
                      {b.availableQuantity}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">
                      {Number(b.productMrp || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {Number(b.vendorDiscountPercentage || 0).toFixed(2)}%
                      {b.vendorDiscountAmount != null && (
                        <span className="block text-[10px] text-slate-500">
                          −{Number(b.vendorDiscountAmount).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-700">
                      {Number(b.purchasePrice || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {Number(b.sellingPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="shrink-0 border-t bg-slate-50 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 shadow-sm transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchListModal;
