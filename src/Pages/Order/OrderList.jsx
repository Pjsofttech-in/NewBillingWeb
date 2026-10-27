import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Plus, Printer, SearchX, Trash2, Truck, X} from "lucide-react";

import {exportOrders} from "../../api/orderApi";
import {orderInstallmentApi} from "../../api/installmentApi";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import StatCard from "./StatCard";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../Hooks/usePagination";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import SearchBar from "../../Components/SearchBar";
import ExportButtons from "../../Components/ExportButtons";
import {
  INITIAL_ORDER_FILTERS,
  toOrderQuery,
  isInvalidOrderRange,
} from "../../utils/orderFilters";
import {moneyAuto as money} from "../../utils/format";


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

const getPaymentDisplay = (order, paidAmount, pendingAmount) => {
  if (order.installmentsComplete || pendingAmount <= 0.009) {
    return {
      label: "Complete",
      style: "bg-emerald-100 text-emerald-700",
      opensInstallments: Boolean(order.hasInstallmentPlan),
    };
  }

  if (order.hasInstallmentPlan || order.installmentRequested) {
    return {
      label: "Installment",
      style: "bg-violet-100 text-violet-700",
      opensInstallments: true,
    };
  }

  if (paidAmount > 0) {
    return {label: "Partial", style: "bg-blue-100 text-blue-700"};
  }

  return {label: "Pending", style: "bg-amber-100 text-amber-700"};
};

// Due date shown for an order:
//  - paid in installments -> the due date of the NEXT unpaid installment
//    (first installment -> its date; once it is paid -> the second one, and so on; "—" when all are paid)
//  - otherwise            -> the order's own due date
// nextDueByOrder = {orderId: earliest unpaid installment due date}, loaded in OrderList below.
const getDueDate = (order, nextDueByOrder) => {
  if (nextDueByOrder?.[order.id]) return nextDueByOrder[order.id];
  if (order.hasInstallmentPlan) return order.nextInstallmentDueDate;
  return order.paymentDueDate;
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

// Payment status badge. "Installment" / "Complete" are buttons that open the installment window.
const PaymentBadge = ({order, display, onOpenInstallments, className = ""}) => {
  const classes = `${BADGE} ${display.style} ${className}`;

  if (!display.opensInstallments) {
    return <span className={classes}>{display.label}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpenInstallments(order)}
      title="Open installment plan"
      className={`${classes} cursor-pointer underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
    >
      {display.label}
    </button>
  );
};

// Same action buttons for the table row and the mobile card.
const OrderActions = ({
  order,
  onPrintInvoice,
  onCreateShipment,
  onRequestDelete,
}) => {
  const cannotDelete = NO_DELETE_STATUSES.includes(order.status);

  return (
    <div className="flex items-center justify-center gap-1">
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

  // Next unpaid installment date of every order on a plan (one request for the whole list).
  // The key starts with "orders" so it refreshes together with the order list whenever an
  // installment plan is created or an installment is paid.
  const {data: openInstallments = []} = useQuery({
    queryKey: ["orders", "installment-due-dates"],
    queryFn: () =>
      orderInstallmentApi.fetchDue({overdueOnly: false, days: 36500}),
    retry: false,
  });

  const nextDueByOrder = useMemo(() => {
    const map = {};
    for (const item of Array.isArray(openInstallments)
      ? openInstallments
      : []) {
      const current = map[item.referenceId];
      if (item.dueDate && (!current || item.dueDate < current)) {
        map[item.referenceId] = item.dueDate;
      }
    }
    return map;
  }, [openInstallments]);

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

    return {
      paidAmount,
      pendingAmount,
      isFullyPaid: pendingAmount <= 0.009,
      paymentDisplay: getPaymentDisplay(order, paidAmount, pendingAmount),
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SearchBar
            value={filters.search}
            onChange={(text) => updateFilter("search", text)}
            placeholder="Search order #, customer, phone, email, city..."
            ariaLabel="Search orders"
          />

          {/* Status filter removed */}

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

      {/* 2) Summary cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          label={hasActiveFilters ? "Order Amount" : "Order Amount"}
          value={money(listTotals.total)}
          tone="blue"
          loading={isLoading}
        />
        <StatCard
          label={hasActiveFilters ? "Paid" : "Paid"}
          value={money(listTotals.paid)}
          tone="emerald"
          loading={isLoading}
        />
        <StatCard
          label={hasActiveFilters ? "Pending" : "Pending"}
          value={money(listTotals.pending)}
          tone="amber"
          loading={isLoading}
        />
        <StatCard
          label={hasActiveFilters ? "GST" : "GST"}
          value={money(listTotals.gst)}
          tone="violet"
          loading={isLoading}
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
              const {paidAmount, pendingAmount, isFullyPaid, paymentDisplay} =
                describeOrder(order);

              return (
                <div
                  key={order.id}
                  className="space-y-2 rounded-md border border-slate-200 bg-white p-3 text-sm"
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
                      {/* Status badge removed */}
                      <PaymentBadge
                        order={order}
                        display={paymentDisplay}
                        onOpenInstallments={onOpenInstallments}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between border-y border-slate-100 py-2 text-xs text-slate-600">
                    <span>
                      Date:{" "}
                      <strong className="text-slate-800">
                        {order.orderDate || "—"}
                      </strong>
                    </span>
                    <span>
                      Due:{" "}
                      <strong>
                        {getDueDate(order, nextDueByOrder) || "—"}
                      </strong>
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
                      <strong className="text-amber-700">
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
          <div className="hidden w-full border-y border-slate-200 bg-white lg:block">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-blue-400 text-white">
                <tr>
                  <th className="px-1.5 py-2">O.No</th>
                  <th className="px-1.5 py-2">Customer</th>
                  <th className="px-1.5 py-2">Order date</th>
                  <th className="px-1.5 py-2 text-right">Total</th>
                  <th className="px-1.5 py-2 text-right">GST</th>
                  <th className="px-1.5 py-2 text-right">Paid</th>
                  <th className="px-1.5 py-2 text-right">Pending</th>
                  <th className="px-1.5 py-2">Due date</th>
                  <th className="px-1.5 py-2">Method</th>
                  <th className="px-1.5 py-2">Payment</th>
                  {/* Status column removed */}
                  <th className="px-1.5 py-2 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagination.paginatedData.map((order) => {
                  const {
                    paidAmount,
                    pendingAmount,
                    isFullyPaid,
                    paymentDisplay,
                  } = describeOrder(order);

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50"
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

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold text-slate-900">
                        {money(order.totalAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold text-violet-700">
                        {money(order.totalGstAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold text-emerald-700">
                        {money(paidAmount)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-right font-semibold text-amber-700">
                        {money(pendingAmount)}
                      </td>

                      {/* Calendar icon removed */}
                      <td className="whitespace-nowrap px-1.5 py-1.5 font-medium text-slate-800">
                        {getDueDate(order, nextDueByOrder) || "—"}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5 text-gray-900">
                        {formatPaymentMethod(order.paymentMethod)}
                      </td>

                      <td className="whitespace-nowrap px-1.5 py-1.5">
                        <PaymentBadge
                          order={order}
                          display={paymentDisplay}
                          onOpenInstallments={onOpenInstallments}
                          className="px-1.5 py-0.5 text-[11px]"
                        />
                      </td>

                      {/* Status cell removed */}

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
                    colSpan={3}
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
