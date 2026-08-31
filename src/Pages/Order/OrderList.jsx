import {useMemo, useState} from "react";
import {
  Package,
  Plus,
  Printer,
  Trash2,
  Truck,
  Filter,
  RotateCcw,
  SearchX,
} from "lucide-react";

import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

const methods = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];

const inRange = (value, min, max) => {
  const numericValue = Number(value || 0);

  return (
    (!min || numericValue >= Number(min)) &&
    (!max || numericValue <= Number(max))
  );
};

const formatPaymentMethod = (method) => {
  if (!method) return "—";

  return method
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getDateRange = (timeframe, customFromDate, customToDate) => {
  const today = new Date();

  const formatDate = (date) => {
    return date.toISOString().slice(0, 10);
  };

  if (timeframe === "ALL") {
    return {
      fromDate: "",
      toDate: "",
    };
  }

  if (timeframe === "TODAY") {
    const todayString = formatDate(today);

    return {
      fromDate: todayString,
      toDate: todayString,
    };
  }

  if (timeframe === "7D") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);

    return {
      fromDate: formatDate(from),
      toDate: formatDate(today),
    };
  }

  if (timeframe === "30D") {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);

    return {
      fromDate: formatDate(from),
      toDate: formatDate(today),
    };
  }

  if (timeframe === "1Y") {
    const from = new Date(today);
    from.setFullYear(today.getFullYear() - 1);

    return {
      fromDate: formatDate(from),
      toDate: formatDate(today),
    };
  }

  if (timeframe === "CUSTOM") {
    return {
      fromDate: customFromDate || "",
      toDate: customToDate || "",
    };
  }

  return {
    fromDate: "",
    toDate: "",
  };
};

const getPaymentStatusStyle = (paidAmount, pendingAmount) => {
  if (pendingAmount <= 0.009) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (paidAmount > 0) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-700";
};

const getOrderStatusStyle = (status) => {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-100 text-emerald-700";

    case "SHIPPED":
      return "bg-indigo-100 text-indigo-700";

    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
};

export default function OrderList({
  orders = [],
  isLoading,
  onOpenCreate,
  onDelete,
  onOpenPayment,
  onPrintInvoice,
  onCreateShipment,
}) {
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    timeframe: "ALL",
    fromDate: "",
    toDate: "",
    method: "",
    minTotal: "",
    maxTotal: "",
    minPaid: "",
    maxPaid: "",
    minPending: "",
    maxPending: "",
  });

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      timeframe: "ALL",
      fromDate: "",
      toDate: "",
      method: "",
      minTotal: "",
      maxTotal: "",
      minPaid: "",
      maxPaid: "",
      minPending: "",
      maxPending: "",
    });
  };

  const filteredOrders = useMemo(() => {
    const {fromDate, toDate} = getDateRange(
      filters.timeframe,
      filters.fromDate,
      filters.toDate,
    );

    return [...orders]
      .filter((order) => {
        const paidAmount = Number(order.paidAmount || 0);

        const pendingAmount = Number(
          order.pendingAmount ??
            Math.max(0, Number(order.totalAmount || 0) - paidAmount),
        );

        const orderDate = String(order.orderDate || "").slice(0, 10);

        const matchesFromDate = !fromDate || orderDate >= fromDate;

        const matchesToDate = !toDate || orderDate <= toDate;

        return (
          (!filters.status || order.status === filters.status) &&
          (!filters.method || order.paymentMethod === filters.method) &&
          matchesFromDate &&
          matchesToDate &&
          inRange(order.totalAmount, filters.minTotal, filters.maxTotal) &&
          inRange(paidAmount, filters.minPaid, filters.maxPaid) &&
          inRange(pendingAmount, filters.minPending, filters.maxPending)
        );
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders, filters]);

  const pagination = usePagination(filteredOrders, 10, JSON.stringify(filters));

  const getPaidAmount = (order) => {
    return Number(order.paidAmount || 0);
  };

  const getPendingAmount = (order) => {
    return Number(
      order.pendingAmount ??
        Math.max(0, Number(order.totalAmount || 0) - getPaidAmount(order)),
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteOrder) return;

    try {
      setIsDeleting(true);
      await onDelete(deleteOrder.id);
    } finally {
      setIsDeleting(false);
      setDeleteOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <DeleteConfirmModal
          isOpen={Boolean(deleteOrder)}
          title="Delete Order"
          itemName={deleteOrder ? `Order #${deleteOrder.id}` : ""}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOrder(null)}
          isLoading={isDeleting}
        />

        {/* FILTER SECTION */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />

              <span className="font-semibold text-slate-700">Filters</span>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {filteredOrders.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                type="button"
                onClick={onOpenCreate}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#0073b7] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#005f99]"
              >
                <Plus className="h-4 w-4" />
                Create Order
              </button>
            </div>
          </div>

          {/* MAIN FILTERS */}
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Select
              name="status"
              placeholder="Order Status"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
              options={[
                "PENDING",
                "CONFIRMED",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
              ].map((status) => ({
                value: status,
                label: status.charAt(0) + status.slice(1).toLowerCase(),
              }))}
            />

            <Select
              name="timeframe"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
              options={[
                {value: "ALL", label: "All Time"},
                {value: "TODAY", label: "Today"},
                {value: "7D", label: "Last 7 Days"},
                {value: "30D", label: "Last 30 Days"},
                {value: "1Y", label: "Last 1 Year"},
                {
                  value: "CUSTOM",
                  label: "Custom Date",
                },
              ]}
            />

            <Select
              name="method"
              placeholder="Payment Method"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
              options={methods.map((method) => ({
                value: method,
                label: formatPaymentMethod(method),
              }))}
            />

            <Input
              name="minTotal"
              type="number"
              placeholder="Min Total"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />

            <Input
              name="maxTotal"
              type="number"
              placeholder="Max Total"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />
          </div>

          {/* CUSTOM DATE */}
          {filters.timeframe === "CUSTOM" && (
            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              <Input
                label="From Date"
                name="fromDate"
                type="date"
                register={(name) => ({
                  value: filters[name],
                  onChange: (event) => updateFilter(name, event.target.value),
                })}
              />

              <Input
                label="To Date"
                name="toDate"
                type="date"
                register={(name) => ({
                  value: filters[name],
                  onChange: (event) => updateFilter(name, event.target.value),
                })}
              />
            </div>
          )}

          {/* PAYMENT AMOUNT FILTERS */}
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              name="minPaid"
              type="number"
              placeholder="Min Paid"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />

            <Input
              name="maxPaid"
              type="number"
              placeholder="Max Paid"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />

            <Input
              name="minPending"
              type="number"
              placeholder="Min Pending"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />

            <Input
              name="maxPending"
              type="number"
              placeholder="Max Pending"
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
            />
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <SearchX className="h-10 w-10 text-slate-300" />

              <p className="mt-3 text-sm text-slate-500">No orders found</p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-sm font-medium text-[#0073b7]"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-right">Paid</th>
                    <th className="p-3 text-right">Pending</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pagination.paginatedData.map((order) => {
                    const paidAmount = getPaidAmount(order);
                    const pendingAmount = getPendingAmount(order);
                    const isFullyPaid = pendingAmount <= 0.009;

                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="p-3 font-semibold text-slate-700">
                          #{order.id}
                        </td>

                        <td className="p-3 font-medium text-slate-700">
                          {order.customer?.customerName || "N/A"}
                        </td>

                        <td className="p-3 whitespace-nowrap text-slate-600">
                          {order.orderDate || "—"}
                        </td>

                        <td className="p-3 text-right font-medium">
                          {money(order.totalAmount)}
                        </td>

                        <td className="p-3 text-right text-emerald-700">
                          {money(paidAmount)}
                        </td>

                        <td className="p-3 text-right text-amber-700">
                          {money(pendingAmount)}
                        </td>

                        <td className="p-3">
                          {formatPaymentMethod(order.paymentMethod)}
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentStatusStyle(
                              paidAmount,
                              pendingAmount,
                            )}`}
                          >
                            {order.paymentStatus ||
                              (isFullyPaid
                                ? "PAID"
                                : paidAmount > 0
                                  ? "PARTIAL"
                                  : "UNPAID")}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusStyle(
                              order.status,
                            )}`}
                          >
                            {order.status || "PENDING"}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenPayment(order)}
                              disabled={isFullyPaid}
                              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isFullyPaid ? "Paid" : "Pay"}
                            </button>

                            <button
                              type="button"
                              onClick={() => onPrintInvoice(order)}
                              title="Invoice"
                              className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                            >
                              <Printer className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onCreateShipment(order)}
                              title="Create Shipment"
                              className="rounded-lg bg-indigo-50 p-2 text-indigo-700 hover:bg-indigo-100"
                            >
                              <Truck className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteOrder(order)}
                              title="Delete"
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredOrders.length > 0 && (
            <div className="border-t border-slate-100 p-3">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
