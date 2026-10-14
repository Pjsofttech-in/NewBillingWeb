import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  CalendarClock,
  Plus,
  Printer,
  SearchX,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import {fetchOrdersGstSummary, exportOrders} from "../../api/orderApi";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import StatCard from "./StatCard";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import SearchBar from "../../Components/SearchBar";
import ExportButtons from "../../Components/ExportButtons";
import {getTodayString} from "../../utils/dateRange";
import {
  INITIAL_ORDER_FILTERS,
  toOrderQuery,
  isInvalidOrderRange,
} from "../../utils/orderFilters";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const methods = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];

const formatPaymentMethod = (method) => {
  if (!method) return "—";

  return String(method)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// "PARTIAL" -> "Partial"
const toSentence = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : "";

const BADGE = "inline-block rounded-full px-2.5 py-1 text-xs font-semibold";

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

const LOCKED_STATUSES = ["SHIPPED", "DELIVERED", "CANCELLED"];
const NO_DELETE_STATUSES = ["SHIPPED", "DELIVERED"];

const iconBtn =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-35";

// Customer name = opens the Edit order window (same idea as the product name).
// Shipped / delivered / cancelled orders cannot be edited, so they stay plain text.
const CustomerNameButton = ({order, onOpenEdit, className = ""}) => {
  const name = order.customer?.customerName || "N/A";

  if (LOCKED_STATUSES.includes(order.status)) {
    return (
      <span
        title="Order cannot be edited in this status"
        className={`font-bold text-slate-900 ${className}`}
      >
        {name}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenEdit(order)}
      title="Click to edit this order"
      className={`text-left font-bold text-blue-700 hover:text-blue-900 hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded cursor-pointer ${className}`}
    >
      {name}
    </button>
  );
};

// Same action buttons for the table row and the mobile card.

const OrderActions = ({
  order,
  isFullyPaid,
  onOpenPayment,
  onOpenInstallments,
  onPrintInvoice,
  onCreateShipment,
  onRequestDelete,
}) => {
  const cannotDelete = NO_DELETE_STATUSES.includes(order.status);

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onOpenPayment(order)}
        disabled={isFullyPaid}
        title={isFullyPaid ? "Fully paid" : "Make payment"}
        className="h-7 cursor-pointer rounded-lg bg-blue-600 px-2 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isFullyPaid ? "Paid" : "Pay"}
      </button>

      <button
        type="button"
        onClick={() => onOpenInstallments(order)}
        disabled={order.status === "CANCELLED"}
        title="Installment plan"
        aria-label="Installment plan"
        className="flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-amber-50 px-2 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CalendarClock className="h-3.5 w-3.5" />
        Installments
      </button>

      <button
        type="button"
        onClick={() => onPrintInvoice(order)}
        title="Invoice"
        aria-label="Invoice"
        className={`${iconBtn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
      >
        <Printer className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onCreateShipment(order)}
        title="Create shipment"
        aria-label="Create shipment"
        className={`${iconBtn} bg-blue-50 text-blue-700 hover:bg-blue-100`}
      >
        <Truck className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={() => onRequestDelete(order)}
        disabled={cannotDelete}
        title={
          cannotDelete
            ? "Shipped/delivered orders cannot be deleted"
            : "Delete order"
        }
        aria-label="Delete order"
        className={`${iconBtn} bg-red-50 text-red-600 hover:bg-red-100`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default function OrderList({
  orders = [],
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onOpenPayment,
  onOpenInstallments,
  onPrintInvoice,
  onCreateShipment,
  filters,
  onFiltersChange,
  onNotify,
}) {
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {data: gstSummary, isLoading: loadingGstSummary} = useQuery({
    queryKey: ["orders-gst-summary"],
    queryFn: fetchOrdersGstSummary,
    staleTime: 30 * 1000,
    retry: 1,
  });

  const updateFilter = (key, value) => {
    onFiltersChange((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(INITIAL_ORDER_FILTERS);

  const invalidRange = isInvalidOrderRange(filters);

  // Search / status / payment method / dates are already applied by the backend
  // (GET /getAllOrders) - here we only keep newest-first.
  const filteredOrders = useMemo(
    () => [...orders].sort((a, b) => Number(b.id) - Number(a.id)),
    [orders],
  );

  // Downloads exactly what the list shows: same filters, done by the backend.
  const handleExport = (format) => exportOrders(format, toOrderQuery(filters));

  const pagination = usePagination(filteredOrders, 25, JSON.stringify(filters));

  // Totals of the orders currently listed (follows the filters, cancelled excluded).
  const listTotals = useMemo(() => {
    const t = {total: 0, gst: 0, paid: 0, pending: 0};
    for (const o of filteredOrders) {
      if (o.status === "CANCELLED") continue;
      const total = Number(o.totalAmount || 0);
      const paid = Number(o.paidAmount || 0);
      t.total += total;
      t.gst += Number(o.totalGstAmount || 0);
      t.paid += paid;
      t.pending += Number(o.pendingAmount ?? Math.max(0, total - paid));
    }
    return t;
  }, [filteredOrders]);

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

  // Everything one order needs to be drawn (used by table row AND mobile card).
  const describeOrder = (order) => {
    const paidAmount = getPaidAmount(order);
    const pendingAmount = getPendingAmount(order);
    const isFullyPaid = pendingAmount <= 0.009;
    const paymentStatus =
      order.paymentStatus ||
      (isFullyPaid ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID");

    return {
      paidAmount,
      pendingAmount,
      isFullyPaid,
      paymentStatus,
      overdue: isOverdueOrder(order, pendingAmount),
    };
  };

  const actionHandlers = {
    onOpenEdit,
    onOpenPayment,
    onOpenInstallments,
    onPrintInvoice,
    onCreateShipment,
    onRequestDelete: setDeleteOrder,
  };

  return (
    <div className="w-full m-0 p-0 space-y-2">
      <DeleteConfirmModal
        isOpen={Boolean(deleteOrder)}
        title="Delete Order"
        itemName={deleteOrder ? `Order #${deleteOrder.id}` : ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOrder(null)}
        isLoading={isDeleting}
      />

      {/* 1) Filters, then total count + action buttons */}
      <div className="w-full space-y-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SearchBar
            value={filters.search}
            onChange={(text) => updateFilter("search", text)}
            placeholder="Search order #, customer, phone, email, city..."
            ariaLabel="Search orders"
          />

          <Select
            name="status"
            placeholder="Status"
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
              label: toSentence(status),
            }))}
          />

          <Select
            name="timeframe"
            register={(name) => ({
              value: filters[name],
              onChange: (event) => updateFilter(name, event.target.value),
            })}
            options={[
              {value: "ALL", label: "Time"},
              {value: "TODAY", label: "Today"},
              {value: "7D", label: "Last 7 Days"},
              {value: "30D", label: "Last 30 Days"},
              {value: "1Y", label: "Last 1 Year"},
              {value: "CUSTOM", label: "Custom Date"},
            ]}
          />

          <Select
            name="method"
            placeholder="Payment Methods"
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

          {filters.timeframe === "CUSTOM" && (
            <>
              <Input
                label="From date"
                name="fromDate"
                type="date"
                register={(name) => ({
                  value: filters[name],
                  onChange: (event) => updateFilter(name, event.target.value),
                })}
              />

              <Input
                label="To date"
                name="toDate"
                type="date"
                register={(name) => ({
                  value: filters[name],
                  onChange: (event) => updateFilter(name, event.target.value),
                })}
              />
            </>
          )}
        </div>

        {invalidRange && (
          <p className="text-xs font-medium text-red-600">
            "From date" cannot be after "To date".
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Total orders
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-white">
              {filteredOrders.length}
            </span>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => onFiltersChange(INITIAL_ORDER_FILTERS)}
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}

            <ExportButtons
              itemName="orders"
              filtered={hasActiveFilters}
              disabled={
                isLoading || invalidRange || filteredOrders.length === 0
              }
              onExport={handleExport}
              onError={(message) => onNotify?.(message, "error")}
            />

            <button
              type="button"
              onClick={onOpenCreate}
              className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create order
            </button>
          </div>
        </div>
      </div>

      {/* 2) Summary cards (all orders, cancelled orders excluded) */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          label="Total order amount"
          value={money(gstSummary?.totalOrderAmount)}
          tone="blue"
          loading={loadingGstSummary}
        />
        <StatCard
          label="Total paid"
          value={money(gstSummary?.totalPaidAmount)}
          tone="emerald"
          loading={loadingGstSummary}
        />
        <StatCard
          label="Total pending"
          value={money(gstSummary?.totalPendingAmount)}
          tone={
            Number(gstSummary?.totalOverdueAmount || 0) > 0 ? "rose" : "amber"
          }
          loading={loadingGstSummary}
        />
        <StatCard
          label="Total GST"
          value={money(gstSummary?.totalGstAmount)}
          tone="violet"
          loading={loadingGstSummary}
        />
      </div>

      {/* 3) Orders */}
      {isLoading ? (
        <div className="w-full border-y border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-500">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center border-y border-slate-200 bg-white p-10 text-center">
          <SearchX className="h-9 w-9 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            No orders match the selected filters.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onFiltersChange(INITIAL_ORDER_FILTERS)}
              className="mt-3 cursor-pointer text-sm font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW */}
          <div className="grid grid-cols-1 gap-3 p-1 sm:grid-cols-2 lg:hidden">
            {pagination.paginatedData.map((order) => {
              const {
                paidAmount,
                pendingAmount,
                isFullyPaid,
                paymentStatus,
                overdue,
              } = describeOrder(order);

              return (
                <div
                  key={order.id}
                  className={`space-y-2 rounded-md border bg-white p-3 text-sm ${
                    overdue ? "border-red-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-500">
                        Order #{order.id}
                      </span>
                      <h3 className="text-base">
                        <CustomerNameButton
                          order={order}
                          onOpenEdit={onOpenEdit}
                          className="block max-w-full truncate"
                        />
                      </h3>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`${BADGE} ${getOrderStatusStyle(order.status)}`}
                      >
                        {toSentence(order.status || "PENDING")}
                      </span>
                      <span
                        className={`${BADGE} ${getPaymentStatusStyle(
                          paymentStatus,
                          paidAmount,
                          pendingAmount,
                        )}`}
                      >
                        {toSentence(paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between border-y border-slate-100 py-2 text-xs text-slate-600">
                    <span>
                      Date:{" "}
                      <strong className="text-slate-800">
                        {order.orderDate || "—"}
                      </strong>
                    </span>
                    <span
                      className={overdue ? "font-semibold text-red-600" : ""}
                    >
                      Due: <strong>{order.paymentDueDate || "—"}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center text-[11px] text-slate-600">
                    <div className="rounded bg-slate-50 p-1">
                      Total
                      <br />
                      <strong className="text-slate-900">
                        {money(order.totalAmount)}
                      </strong>
                    </div>
                    <div className="rounded bg-slate-50 p-1">
                      Paid
                      <br />
                      <strong className="text-emerald-700">
                        {money(paidAmount)}
                      </strong>
                    </div>
                    <div className="rounded bg-slate-50 p-1">
                      Pending
                      <br />
                      <strong
                        className={overdue ? "text-red-600" : "text-amber-700"}
                      >
                        {money(pendingAmount)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>
                      GST:{" "}
                      <strong className="text-violet-700">
                        {money(order.totalGstAmount)}
                      </strong>
                    </span>
                    <span>
                      Method:{" "}
                      <strong className="text-slate-800">
                        {formatPaymentMethod(order.paymentMethod)}
                      </strong>
                    </span>
                  </div>

                  <OrderActions
                    order={order}
                    isFullyPaid={isFullyPaid}
                    {...actionHandlers}
                  />
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW */}
          {/* <div className="hidden w-full overflow-x-auto border-y border-slate-200 bg-white lg:block">
            <table className="w-full border-collapse text-left text-sm text-black">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-3">Order no.</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Order date</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3 text-right">GST</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Pending</th>
                  <th className="px-3 py-3">Due date</th>
                  <th className="px-3 py-3">Method</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagination.paginatedData.map((order) => {
                  const {
                    paidAmount,
                    pendingAmount,
                    isFullyPaid,
                    paymentStatus,
                    overdue,
                  } = describeOrder(order);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-slate-50 ${
                        overdue ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-500">
                        #{order.id}
                      </td>

                      <td className="max-w-48 px-3 py-2 text-sm">
                        <CustomerNameButton
                          order={order}
                          onOpenEdit={onOpenEdit}
                          className="block max-w-full truncate"
                        />
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {order.orderDate || "—"}
                      </td>

                      //

                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-slate-900">
                        {money(order.totalAmount)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-violet-700">
                        {money(order.totalGstAmount)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-right font-bold text-emerald-700">
                        {money(paidAmount)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-bold ${
                          overdue ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {money(pendingAmount)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-3 py-2 font-medium ${
                          overdue ? "text-red-600" : "text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-4 w-4 shrink-0" />
                          <span>{order.paymentDueDate || "—"}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {formatPaymentMethod(order.paymentMethod)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`${BADGE} ${getPaymentStatusStyle(
                            paymentStatus,
                            paidAmount,
                            pendingAmount,
                          )}`}
                        >
                          {toSentence(paymentStatus)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`${BADGE} ${getOrderStatusStyle(order.status)}`}
                        >
                          {toSentence(order.status || "PENDING")}
                        </span>
                      </td>

                      <td className="px-3 py-2">
                        <OrderActions
                          order={order}
                          isFullyPaid={isFullyPaid}
                          {...actionHandlers}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t-2 border-slate-300 bg-slate-100 text-sm font-bold text-slate-900">
                <tr>
                  <td
                    className="px-3 py-2.5"
                    colSpan={4}
                  >
                    Total ({filteredOrders.length} orders)
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {money(listTotals.total)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-violet-700">
                    {money(listTotals.gst)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-emerald-700">
                    {money(listTotals.paid)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-amber-700">
                    {money(listTotals.pending)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div> */}
          <div className="hidden w-full border-y border-slate-200 bg-white lg:block">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-1.5 py-2">Order no.</th>
                  <th className="px-1.5 py-2">Customer</th>
                  <th className="px-1.5 py-2">Order date</th>
                  <th className="px-1.5 py-2">Due date</th>
                  <th className="px-1.5 py-2 text-right">Total</th>
                  <th className="px-1.5 py-2 text-right">GST</th>
                  <th className="px-1.5 py-2 text-right">Paid</th>
                  <th className="px-1.5 py-2 text-right">Pending</th>
                  <th className="px-1.5 py-2">Method</th>
                  <th className="px-1.5 py-2">Payment</th>
                  <th className="px-1.5 py-2">Status</th>
                  <th className="px-1.5 py-2 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagination.paginatedData.map((order) => {
                  const {
                    paidAmount,
                    pendingAmount,
                    isFullyPaid,
                    paymentStatus,
                    overdue,
                  } = describeOrder(order);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-slate-50 ${
                        overdue ? "bg-red-50/40" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-1.5 py-1.5 font-bold text-slate-500">
                        #{order.id}
                      </td>

                      <td className="max-w-28 px-1.5 py-1.5 text-xs">
                        <CustomerNameButton
                          order={order}
                          onOpenEdit={onOpenEdit}
                          className="block max-w-full truncate"
                        />
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-slate-600">
                        {order.orderDate || "—"}
                      </td>

                      <td
                        className={`whitespace-nowrap px-1.5 py-1.5 font-medium ${
                          overdue ? "text-red-600" : "text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                          <span>{order.paymentDueDate || "—"}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-bold text-slate-900">
                        {money(order.totalAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-bold text-violet-700">
                        {money(order.totalGstAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-bold text-emerald-700">
                        {money(paidAmount)}
                      </td>

                      <td
                        className={`whitespace-nowrap px-1.5 py-1.5 text-right font-bold ${
                          overdue ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {money(pendingAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-slate-600">
                        {formatPaymentMethod(order.paymentMethod)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5">
                        <span
                          className={`${BADGE} px-1.5 py-0.5 text-[11px] ${getPaymentStatusStyle(
                            paymentStatus,
                            paidAmount,
                            pendingAmount,
                          )}`}
                        >
                          {toSentence(paymentStatus)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5">
                        <span
                          className={`${BADGE} px-1.5 py-0.5 text-[11px] ${getOrderStatusStyle(order.status)}`}
                        >
                          {toSentence(order.status || "PENDING")}
                        </span>
                      </td>

                      <td className="px-1.5 py-1.5">
                        <OrderActions
                          order={order}
                          isFullyPaid={isFullyPaid}
                          {...actionHandlers}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="border-t-2 border-slate-300 bg-slate-100 text-xs font-bold text-slate-900">
                <tr>
                  <td
                    className="px-1.5 py-2"
                    colSpan={4}
                  >
                    Total ({filteredOrders.length} orders)
                  </td>
                  <td className="px-1.5 py-2 text-right">
                    {money(listTotals.total)}
                  </td>
                  <td className="px-1.5 py-2 text-right text-violet-700">
                    {money(listTotals.gst)}
                  </td>
                  <td className="px-1.5 py-2 text-right text-emerald-700">
                    {money(listTotals.paid)}
                  </td>
                  <td className="px-1.5 py-2 text-right text-amber-700">
                    {money(listTotals.pending)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="px-2 py-1">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={pagination.setCurrentPage}
              onItemsPerPageChange={pagination.setItemsPerPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
