import {useQuery} from "@tanstack/react-query";
import {getStockHistory} from "../../api/productApi";

const StockHistoryModal = ({isOpen, product, onClose}) => {
  const {
    data: historyList = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["stockHistory", product?.id],
    queryFn: () => getStockHistory(product.id),
    enabled: Boolean(isOpen && product?.id),
  });

  if (!isOpen) return null;

  // Calculate quick stats
  const totalAddedQty = historyList.reduce(
    (sum, item) => sum + (item.addedQuantity || 0),
    0,
  );
  const latestPrice = historyList[0]?.storePrice ?? product?.storePrice ?? 0;

  const formatDate = (dateString) => {
    if (!dateString) return {date: "N/A", time: ""};
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case "RESTOCK":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INITIAL_STOCK":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* HEADER */}
        <div className="flex justify-between items-start sm:items-center px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                #{product?.id}
              </span>
              <h3 className="font-bold text-gray-900 text-lg sm:text-xl truncate max-w-md">
                {product?.productName}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete stock refill and price history log
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 p-1.5 rounded-full transition"
            title="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* QUICK STATS BAR */}
        {!isLoading && !isError && historyList.length > 0 && (
          <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-gray-50/50 border-b border-gray-100 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-gray-500 block">Total Entries</span>
              <span className="font-bold text-gray-900 text-sm">
                {historyList.length}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-gray-500 block">Total Restocked</span>
              <span className="font-bold text-emerald-600 text-sm">
                +{totalAddedQty}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-gray-500 block">Latest Buy Price</span>
              <span className="font-bold text-blue-700 text-sm">
                ₹{latestPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-gray-50/30">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-sm font-medium text-gray-500">
                Fetching stock history...
              </p>
            </div>
          ) : isError ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-800">
                Failed to load history
              </p>
              <button
                onClick={() => refetch()}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="inline-flex p-3 bg-gray-100 text-gray-400 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                No stock history available.
              </p>
              <p className="text-xs text-gray-400">
                Stock updates for this product will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE CARD VIEW (< md) */}
              <div className="space-y-3 md:hidden">
                {historyList.map((item) => {
                  const {date, time} = formatDate(item.createdAt);
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                        <div>
                          <span className="font-semibold text-gray-900 block">
                            {date}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            {time}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                            item.transactionType,
                          )}`}
                        >
                          {item.transactionType || "ENTRY"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-gray-600 py-1">
                        <div>
                          <span className="text-gray-400 block text-[10px]">
                            VENDOR
                          </span>
                          <span className="font-semibold text-gray-800 truncate block">
                            {item.vendor?.vendorName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">
                            STORE PRICE
                          </span>
                          <span className="font-bold text-blue-700">
                            ₹{item.storePrice?.toLocaleString() || "0"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                        <span className="text-gray-500">
                          Stock: <strong>{item.previousStock}</strong> →{" "}
                          <strong className="text-gray-900">
                            {item.newStock}
                          </strong>
                        </span>
                        <span className="font-bold text-emerald-600">
                          +{item.addedQuantity} Added
                        </span>
                      </div>

                      {item.remarks && (
                        <p className="text-gray-500 text-[11px] italic bg-yellow-50/50 p-1.5 rounded border border-yellow-100/50">
                          Note: {item.remarks}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
              <div className="hidden md:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b border-gray-200 text-[11px] tracking-wider">
                    <tr>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-center">Prev</th>
                      <th className="p-3 text-center">Added</th>
                      <th className="p-3 text-center">New</th>
                      <th className="p-3">Store Price</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyList.map((item) => {
                      const {date, time} = formatDate(item.createdAt);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50/80 transition-colors"
                        >
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 block">
                              {date}
                            </span>
                            <span className="text-gray-400 text-[10px]">
                              {time}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-gray-800 max-w-36 truncate">
                            {item.vendor?.vendorName || "N/A"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                                item.transactionType,
                              )}`}
                            >
                              {item.transactionType || "ENTRY"}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium text-gray-500">
                            {item.previousStock}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                            +{item.addedQuantity}
                          </td>
                          <td className="p-3 text-center font-bold text-gray-900">
                            {item.newStock}
                          </td>
                          <td className="p-3 font-semibold text-blue-700 whitespace-nowrap">
                            ₹{item.storePrice?.toLocaleString() || "0"}
                          </td>
                          <td className="p-3 text-gray-500 max-w-xs truncate">
                            {item.remarks || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <span className="text-xs text-gray-400 hidden sm:inline">
            Press ESC or click close to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;
