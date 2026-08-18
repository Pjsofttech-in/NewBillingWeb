import {useState, useMemo} from "react";
import {Package, Plus, Printer, Trash2} from "lucide-react";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";

const OrderList = ({
  orders = [],
  isLoading,
  onOpenCreate,
  onDelete,
  onOpenPayment,
  onPrintInvoice,
}) => {
  // Delete Modal State
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sort orders so the newest ones appear first
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (a.id && b.id) {
        return Number(b.id) - Number(a.id);
      }
      return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
    });
  }, [orders]);

  // Use Pagination Hook
  const pagination = usePagination(sortedOrders, 10);

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(orderToDelete.id || orderToDelete);
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="p-3 sm:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Reusable Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={Boolean(orderToDelete)}
          title="Delete Order"
          itemName={orderToDelete ? `Order #${orderToDelete.id}` : ""}
          onConfirm={handleConfirmDelete}
          onCancel={() => setOrderToDelete(null)}
          isLoading={isDeleting}
        />

        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Order Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage, pay, and track all customer orders
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0073b7] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#0867a0] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>

        {/* Orders Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col p-4">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading Orders...
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm">
                No orders found. Click above to create one.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE CARD VIEW (< lg screens) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
                {pagination.paginatedData.map((order) => {
                  const isPaid =
                    order.paymentStatus === "SUCCESS" ||
                    order.paymentStatus === "PAID" ||
                    order.status === "COMPLETED";

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: ID, Customer & Status */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-400">
                              #{order.id}
                            </span>
                            <h3 className="font-semibold text-slate-800 text-base leading-tight truncate">
                              {order.customer?.customerName || "N/A"}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {order.orderDate}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full shrink-0 ${
                              order.status === "COMPLETED" ||
                              order.status === "DELIVERED"
                                ? "bg-green-100 text-green-800"
                                : order.status === "SHIPPED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {/* Order Amount */}
                        <div className="my-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">
                            Total Amount
                          </span>
                          <span className="text-base font-bold text-slate-800">
                            ₹
                            {order.totalAmount
                              ? order.totalAmount.toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Pay Now Button */}
                          <button
                            onClick={() => onOpenPayment(order)}
                            disabled={isPaid}
                            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-700 cursor-not-allowed border border-emerald-200"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                            }`}
                          >
                            {isPaid ? "✓ Paid" : "Pay Now"}
                          </button>

                          {/* Print Invoice Button */}
                          <button
                            onClick={() =>
                              onPrintInvoice && onPrintInvoice(order)
                            }
                            title="Print Invoice"
                            className="flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => setOrderToDelete(order)}
                          title="Delete Order"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (>= lg screens) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pagination.paginatedData.map((order) => {
                      const isPaid =
                        order.paymentStatus === "SUCCESS" ||
                        order.paymentStatus === "PAID" ||
                        order.status === "COMPLETED";

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 font-bold text-slate-700">
                            #{order.id}
                          </td>
                          <td className="p-4">
                            {order.customer?.customerName || "N/A"}
                          </td>
                          <td className="p-4">{order.orderDate}</td>
                          <td className="p-4 font-bold text-slate-800">
                            ₹
                            {order.totalAmount
                              ? order.totalAmount.toFixed(2)
                              : "0.00"}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                order.status === "COMPLETED" ||
                                order.status === "DELIVERED"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "SHIPPED"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Payment Button */}
                              <button
                                onClick={() => onOpenPayment(order)}
                                disabled={isPaid}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-700 cursor-not-allowed border border-emerald-200"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                                }`}
                              >
                                {isPaid ? (
                                  <span className="flex items-center gap-1">
                                    ✓ Paid
                                  </span>
                                ) : (
                                  "Pay Now"
                                )}
                              </button>

                              {/* Print Invoice Button */}
                              <button
                                onClick={() =>
                                  onPrintInvoice && onPrintInvoice(order)
                                }
                                title="Print Invoice"
                                className="flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Invoice</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setOrderToDelete(order)}
                                title="Delete Order"
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Reusable Pagination Controls */}
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={pagination.setCurrentPage}
                onItemsPerPageChange={pagination.setItemsPerPage}
                itemName="orders"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
