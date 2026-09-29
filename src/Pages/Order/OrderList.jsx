import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  CalendarClock,
  Pencil,
  Plus,
  Printer,
  SearchX,
  Trash2,
  Truck,
} from "lucide-react";

import {fetchOrdersGstSummary} from "../../api/orderApi";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const methods = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];

const initialFilters = {
  status: "",
  timeframe: "ALL",
  fromDate: "",
  toDate: "",
  method: "",
};

const formatPaymentMethod = (method) => {
  if (!method) return "—";

  return String(method)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDateRange = (timeframe, customFromDate, customToDate) => {
  const today = new Date();

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  if (timeframe === "ALL") {
    return {fromDate: "", toDate: ""};
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

const getPaymentStatusStyle = (status, paidAmount, pendingAmount) => {
  if (status === "OVERDUE") {
    return "bg-red-100 text-red-700";
  }

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
      return "bg-blue-100 text-blue-700";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const isOverdueOrder = (order, pendingAmount) => {
  if (pendingAmount <= 0.009 || !order.paymentDueDate) {
    return false;
  }

  if (order.paymentOverdue === true) {
    return true;
  }

  return String(order.paymentDueDate).slice(0, 10) < getTodayString();
};

const SummaryCard = ({label, value, loading, danger = false}) => (
  <div
    className={`flex h-9 min-w-0 items-center justify-between rounded-lg border px-2 py-1 ${
      danger ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
    }`}
  >
    <span
      className={`truncate text-[10px] font-semibold uppercase tracking-wide ${
        danger ? "text-red-500" : "text-slate-500"
      }`}
    >
      {label}
    </span>

    {loading ? (
      <div className="h-3.5 w-14 animate-pulse rounded bg-slate-200" />
    ) : (
      <span
        className={`ml-1 truncate text-[11px] font-bold ${
          danger ? "text-red-700" : "text-slate-800"
        }`}
      >
        {value}
      </span>
    )}
  </div>
);

export default function OrderList({
  orders = [],
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onOpenPayment,
  onPrintInvoice,
  onCreateShipment,
}) {
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filters, setFilters] = useState(initialFilters);

  const {data: gstSummary, isLoading: loadingGstSummary} = useQuery({
    queryKey: ["orders-gst-summary"],
    queryFn: fetchOrdersGstSummary,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const filteredOrders = useMemo(() => {
    const {fromDate, toDate} = getDateRange(
      filters.timeframe,
      filters.fromDate,
      filters.toDate,
    );

    return [...orders]
      .filter((order) => {
        const orderDate = String(order.orderDate || "").slice(0, 10);

        return (
          (!filters.status || order.status === filters.status) &&
          (!filters.method || order.paymentMethod === filters.method) &&
          (!fromDate || orderDate >= fromDate) &&
          (!toDate || orderDate <= toDate)
        );
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders, filters]);

  const pagination = usePagination(filteredOrders, 10, JSON.stringify(filters));

  const getPaidAmount = (order) => Number(order.paidAmount || 0);

  const getPendingAmount = (order) =>
    Number(
      order.pendingAmount ??
        Math.max(0, Number(order.totalAmount || 0) - getPaidAmount(order)),
    );

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
    <div className="min-h-screen bg-slate-50 p-1 sm:p-2 lg:p-3">
      <div className="mx-auto max-w-[1800px] space-y-2">
        <DeleteConfirmModal
          isOpen={Boolean(deleteOrder)}
          title="Delete Order"
          itemName={deleteOrder ? `Order #${deleteOrder.id}` : ""}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteOrder(null)}
          isLoading={isDeleting}
        />

        {/* FILTERS & TOP BAR */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex h-10 items-center justify-between border-b border-slate-100 px-3">
            <div />

            <button
              type="button"
              onClick={onOpenCreate}
              className="flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-blue-600 px-2.5 text-[11px] font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Order
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 items-center gap-2 p-2 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              name="status"
              placeholder="All Statuses"
              allowEmpty
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
                {value: "CUSTOM", label: "Custom Date"},
              ]}
            />

            <Select
              name="method"
              placeholder="All Payment Methods"
              allowEmpty
              register={(name) => ({
                value: filters[name],
                onChange: (event) => updateFilter(name, event.target.value),
              })}
              options={methods.map((method) => ({
                value: method,
                label: formatPaymentMethod(method),
              }))}
            />

            <SummaryCard
              label="Total GST"
              value={money(gstSummary?.totalGstAmount)}
              loading={loadingGstSummary}
            />
          </div>

          {/* Custom Date */}
          {filters.timeframe === "CUSTOM" && (
            <div className="grid grid-cols-1 gap-2 border-t border-slate-100 bg-slate-50 p-2 sm:grid-cols-2">
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
        </div>

        {/* ORDERS TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <SearchX className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-500">
                No orders match the selected filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-[12px] leading-tight">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-semibold uppercase tracking-wide text-slate-800">
                    <th className="w-[4%] whitespace-nowrap px-2 py-1.5 pl-2">
                      #
                    </th>

                    <th className="w-[11%] whitespace-nowrap px-2 py-1.5">
                      Customer
                    </th>

                    <th className="w-[8%] whitespace-nowrap px-2.5 py-1.5">
                      Date
                    </th>

                    <th className="w-[8%] whitespace-nowrap px-2.5 py-1.5">
                      Due
                    </th>

                    <th className="w-[7%] whitespace-nowrap px-2 py-1.5 text-right">
                      Total
                    </th>

                    <th className="w-[7%] whitespace-nowrap px-2 py-1.5 text-right">
                      GST
                    </th>

                    <th className="w-[7%] whitespace-nowrap px-2 py-1.5 text-right">
                      Paid
                    </th>

                    <th className="w-[7%] whitespace-nowrap px-2 py-1.5 text-right">
                      Pending
                    </th>

                    <th className="hidden w-[8%] whitespace-nowrap px-2 py-1.5 md:table-cell">
                      Method
                    </th>

                    <th className="w-[6%] whitespace-nowrap px-2 py-1.5">
                      Pay
                    </th>

                    <th className="w-[7%] whitespace-nowrap px-2 py-1.5">
                      Status
                    </th>

                    <th className="w-[12%] whitespace-nowrap px-2 py-1.5 pr-2 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pagination.paginatedData.map((order) => {
                    const paidAmount = getPaidAmount(order);
                    const pendingAmount = getPendingAmount(order);
                    const overdue = isOverdueOrder(order, pendingAmount);
                    const isFullyPaid = pendingAmount <= 0.009;

                    const paymentStatus =
                      order.paymentStatus ||
                      (isFullyPaid
                        ? "PAID"
                        : paidAmount > 0
                          ? "PARTIAL"
                          : "UNPAID");

                    return (
                      <tr
                        key={order.id}
                        className={`transition hover:bg-slate-50 ${
                          overdue ? "bg-red-50/30" : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="whitespace-nowrap px-2 py-1.5 pl-2 font-semibold text-slate-700">
                          #{order.id}
                        </td>

                        {/* CUSTOMER */}
                        <td
                          className="max-w-[110px] truncate px-2 py-1.5 font-medium text-slate-700"
                          title={order.customer?.customerName}
                        >
                          {order.customer?.customerName || "N/A"}
                        </td>

                        {/* DATE */}
                        <td className="whitespace-nowrap px-2.5 py-1.5 text-slate-600">
                          {order.orderDate || "—"}
                        </td>

                        {/* DUE */}
                        <td
                          className={`whitespace-nowrap px-2.5 py-1.5 font-medium ${
                            overdue ? "text-red-600" : "text-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                            <span>{order.paymentDueDate || "—"}</span>
                          </div>
                        </td>

                        {/* TOTAL */}
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium">
                          {money(order.totalAmount)}
                        </td>

                        {/* GST */}
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold text-violet-700">
                          {money(order.totalGstAmount)}
                        </td>

                        {/* PAID */}
                        <td className="whitespace-nowrap px-2 py-1.5 text-right text-emerald-700">
                          {money(paidAmount)}
                        </td>

                        {/* PENDING */}
                        <td
                          className={`whitespace-nowrap px-2 py-1.5 text-right font-medium ${
                            overdue ? "text-red-600" : "text-amber-700"
                          }`}
                        >
                          {money(pendingAmount)}
                        </td>

                        {/* METHOD */}
                        <td className="hidden whitespace-nowrap px-2 py-1.5 md:table-cell">
                          {formatPaymentMethod(order.paymentMethod)}
                        </td>

                        {/* PAYMENT STATUS */}
                        <td className="whitespace-nowrap px-2 py-1.5">
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-[8px] font-semibold leading-none ${getPaymentStatusStyle(
                              paymentStatus,
                              paidAmount,
                              pendingAmount,
                            )}`}
                          >
                            {paymentStatus}
                          </span>
                        </td>

                        {/* ORDER STATUS */}
                        <td className="whitespace-nowrap px-2 py-1.5">
                          <span
                            className={`inline-block rounded px-1 py-0.5 text-[8px] font-semibold leading-none ${getOrderStatusStyle(
                              order.status,
                            )}`}
                          >
                            {order.status || "PENDING"}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-2 py-1.5 pr-2">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onOpenEdit(order)}
                              disabled={
                                order.status === "SHIPPED" ||
                                order.status === "DELIVERED" ||
                                order.status === "CANCELLED"
                              }
                              title={
                                order.status === "SHIPPED" ||
                                order.status === "DELIVERED" ||
                                order.status === "CANCELLED"
                                  ? "Order cannot be edited in this status"
                                  : "Edit Order"
                              }
                              className="rounded bg-amber-50 p-1 text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* Payment */}
                            <button
                              type="button"
                              onClick={() => onOpenPayment(order)}
                              disabled={isFullyPaid}
                              title={isFullyPaid ? "Paid" : "Make Payment"}
                              className="rounded bg-blue-600 px-1.5 py-1 text-[8px] font-medium leading-none text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isFullyPaid ? "Paid" : "Pay"}
                            </button>

                            {/* Invoice */}
                            <button
                              type="button"
                              onClick={() => onPrintInvoice(order)}
                              title="Invoice"
                              className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            {/* Shipment */}
                            <button
                              type="button"
                              onClick={() => onCreateShipment(order)}
                              title="Create Shipment"
                              className="rounded bg-blue-50 p-1 text-blue-700 hover:bg-blue-100"
                            >
                              <Truck className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteOrder(order)}
                              disabled={
                                order.status === "SHIPPED" ||
                                order.status === "DELIVERED"
                              }
                              title={
                                order.status === "SHIPPED" || order.status === "DELIVERED"
                                  ? "Shipped/delivered orders cannot be deleted"
                                  : "Delete"
                              }
                              className="rounded bg-red-50 p-1 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* PAGINATION */}
          {!isLoading && filteredOrders.length > 0 && (
            <div className="border-t border-slate-100 p-2">
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
