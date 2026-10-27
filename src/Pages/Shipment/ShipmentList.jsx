import {useMemo, useState} from "react";
import {
  Ban,
  Download,
  ExternalLink,
  FileText,
  IndianRupee,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import Select from "../../Components/Form/Select";
import SearchBar from "../../Components/SearchBar";
import ExportButtons from "../../Components/ExportButtons";
import {
  exportShipments,
  openShipmentReceipt,
  downloadShipmentReceipt,
} from "../../api/shipmentApi";
import {shipmentDateRange, toShipmentQuery} from "../../utils/shipmentFilters";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";
import {inr} from "../../utils/vendorPricing";

// Badge colour + the dot in front of the text.
const STATUS_STYLES = {
  PREPARING: {badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500"},
  SHIPPED: {badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500"},
  IN_TRANSIT: {badge: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-500"},
  OUT_FOR_DELIVERY: {badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500"},
  DELIVERED: {badge: "bg-green-100 text-green-800", dot: "bg-green-500"},
  CANCELLED: {badge: "bg-red-100 text-red-800", dot: "bg-red-500"},
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  timeframe: "ALL",
  fromDate: "",
  toDate: "",
};

const dateInputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-base";

const TONES = {
  blue: {
    box: "bg-blue-50 border-blue-200",
    icon: "bg-blue-100 text-blue-700",
    value: "text-blue-800",
  },
  emerald: {
    box: "bg-emerald-50 border-emerald-200",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-800",
  },
  rose: {
    box: "bg-rose-50 border-rose-200",
    icon: "bg-rose-100 text-rose-700",
    value: "text-rose-800",
  },
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  tone = "blue",
  loading = false,
}) => {
  const t = TONES[tone] || TONES.blue;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-xs ${t.box}`}
      title={`${label}: ${loading ? "..." : value}`}
    >
      {Icon && (
        <div className={`shrink-0 rounded-md p-1.5 ${t.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium leading-tight text-slate-700">
          {label}
        </p>
        <p className={`text-sm font-medium leading-tight ${t.value}`}>
          {loading ? "..." : value}
        </p>
      </div>
    </div>
  );
};

const StatusBadge = ({status}) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PREPARING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status?.replaceAll("_", " ") || "—"}
    </span>
  );
};

const MiniField = ({label, children}) => (
  <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
    <p className="text-[11px] text-slate-500">{label}</p>
    <div className="truncate text-xs font-semibold text-slate-800">
      {children}
    </div>
  </div>
);

const StateBox = ({icon: Icon, children}) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-500">
    {Icon && <Icon className="h-10 w-10 stroke-1 text-slate-300" />}
    {children}
  </div>
);

// Small square icon button used in the table (with a tooltip).
const iconBtn =
  "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition active:scale-95";

// The backend sends the order as `orderId` (the nested `order` object is not serialized).
const getOrderId = (shipment) => shipment.orderId ?? shipment.order?.id ?? null;

const ShipmentList = ({
  shipments = [],
  summary = null,
  loadingSummary = false,
  isLoading = false,
  onOpenCreate,
  onDelete,
  onNotify,
}) => {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [shipmentToDelete, setShipmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCustom = filters.timeframe === "CUSTOM";
  const invalidRange =
    isCustom &&
    filters.fromDate &&
    filters.toDate &&
    filters.fromDate > filters.toDate;

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    filters.timeframe !== "ALL";

  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateTimeframe = (value) => {
    setFilters((prev) => ({
      ...prev,
      timeframe: value,
      fromDate: value === "CUSTOM" ? prev.fromDate : "",
      toDate: value === "CUSTOM" ? prev.toDate : "",
    }));
  };

  const {fromDate: rangeFrom, toDate: rangeTo} = shipmentDateRange(filters);

  // How many shipments are in each status (for the quick filter chips).
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const shipment of shipments) {
      counts[shipment.status] = (counts[shipment.status] || 0) + 1;
    }
    return counts;
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    const query = filters.search.toLowerCase().trim();

    return shipments.filter((shipment) => {
      const shipmentDate = shipment.shipmentDate
        ? String(shipment.shipmentDate).slice(0, 10)
        : "";

      const matchesSearch =
        !query ||
        shipment.shipmentName?.toLowerCase().includes(query) ||
        shipment.trackingId?.toLowerCase().includes(query) ||
        shipment.customerName?.toLowerCase().includes(query) ||
        shipment.customerMobile?.toLowerCase().includes(query) ||
        shipment.companyName?.toLowerCase().includes(query) ||
        shipment.employeeName?.toLowerCase().includes(query) ||
        String(getOrderId(shipment) || "").includes(query) ||
        String(shipment.id || "").includes(query);

      const matchesStatus =
        !filters.status || shipment.status === filters.status;

      const matchesDate =
        (!rangeFrom && !rangeTo) ||
        (Boolean(shipmentDate) &&
          (!rangeFrom || shipmentDate >= rangeFrom) &&
          (!rangeTo || shipmentDate <= rangeTo));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [shipments, filters.search, filters.status, rangeFrom, rangeTo]);

  // Downloads exactly what the list shows: same filters, done by the backend.
  const handleExport = (format) =>
    exportShipments(format, toShipmentQuery(filters));

  const handleReceipt = async (shipmentId) => {
    try {
      await openShipmentReceipt(shipmentId);
    } catch (error) {
      onNotify?.(
        error.response?.data?.message || "Could not open the receipt",
        "error",
      );
    }
  };

  const handleReceiptDownload = async (shipmentId) => {
    try {
      await downloadShipmentReceipt(shipmentId);
    } catch (error) {
      onNotify?.(error.message || "Could not download the receipt", "error");
    }
  };

  const listedCostTotal = useMemo(
    () =>
      filteredShipments.reduce(
        (sum, sh) =>
          sh.status === "CANCELLED" ? sum : sum + Number(sh.shipmentCost || 0),
        0,
      ),
    [filteredShipments],
  );

  const paginationKey = JSON.stringify(filters);

  const pagination = usePagination(filteredShipments, 25, paginationKey);

  // Sr No continues across pages (page 2 with 25 rows starts at 26).
  const firstSrNo = (pagination.currentPage - 1) * pagination.itemsPerPage;

  const handleConfirmDelete = async () => {
    if (!shipmentToDelete) return;

    try {
      setIsDeleting(true);

      await onDelete(shipmentToDelete.id);
    } finally {
      setIsDeleting(false);
      setShipmentToDelete(null);
    }
  };

  return (
    <div className="space-y-3">
      <DeleteConfirmModal
        isOpen={Boolean(shipmentToDelete)}
        title="Delete Shipment"
        itemName={
          shipmentToDelete
            ? shipmentToDelete.shipmentName ||
              `Shipment #${shipmentToDelete.id}`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setShipmentToDelete(null)}
        isLoading={isDeleting}
      />

      {/* Filters Section */}
      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SearchBar
            value={filters.search}
            onChange={(text) => updateFilter("search", text)}
            placeholder="Search shipment, order, customer, courier..."
            ariaLabel="Search shipments"
            debounceMs={0}
          />

          <Select
            name="shipmentTimeframe"
            register={() => ({
              value: filters.timeframe,
              onChange: (e) => updateTimeframe(e.target.value),
            })}
            options={[
              {value: "ALL", label: "All Time"},
              {value: "TODAY", label: "Today"},
              {value: "7D", label: "Last 7 Days"},
              {value: "30D", label: "Last 30 Days"},
              {value: "1Y", label: "Last 1 Year"},
              {value: "CUSTOM", label: "Custom"},
            ]}
          />
        </div>

        {isCustom && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor="fromDate"
                className="mb-0.5 block text-xs font-semibold text-slate-600"
              >
                From date
              </label>
              <input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                max={filters.toDate || undefined}
                onChange={(e) => updateFilter("fromDate", e.target.value)}
                className={dateInputClass}
              />
            </div>

            <div>
              <label
                htmlFor="toDate"
                className="mb-0.5 block text-xs font-semibold text-slate-600"
              >
                To date
              </label>
              <input
                id="toDate"
                type="date"
                value={filters.toDate}
                min={filters.fromDate || undefined}
                onChange={(e) => updateFilter("toDate", e.target.value)}
                className={dateInputClass}
              />
            </div>

            {invalidRange && (
              <p className="text-xs font-medium text-red-600 sm:col-span-2">
                "From date" cannot be after "To date".
              </p>
            )}
          </div>
        )}

        {/* Quick status filter (click a status to show only those shipments) */}
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap items-center gap-1.5"
        >
          {[
            {value: "", label: "All", count: shipments.length},
            ...Object.keys(STATUS_STYLES).map((status) => ({
              value: status,
              label: status
                .replaceAll("_", " ")
                .toLowerCase()
                .replace(/^./, (char) => char.toUpperCase()),
              count: statusCounts[status] || 0,
            })),
          ].map((chip) => {
            const active = filters.status === chip.value;

            return (
              <button
                key={chip.value || "ALL"}
                type="button"
                onClick={() => updateFilter("status", chip.value)}
                aria-pressed={active}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {chip.label.toLowerCase()}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Summary cards (instead of the "Showing X of Y" text) */}
            <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-120">
              <StatCard
                label="Total Shipments"
                value={summary?.totalShipments ?? shipments.length}
                icon={Truck}
                tone="blue"
                loading={loadingSummary}
              />
              <StatCard
                label="Shipment Cost"
                value={inr(summary?.totalShipmentCost)}
                icon={IndianRupee}
                tone="emerald"
                loading={loadingSummary}
              />
              <StatCard
                label="Cancelled Shipments"
                value={summary?.cancelledShipments ?? 0}
                icon={Ban}
                tone="rose"
                loading={loadingSummary}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => setFilters(INITIAL_FILTERS)}
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons
              size="sm"
              itemName="shipments"
              filtered={hasActiveFilters}
              disabled={
                isLoading ||
                Boolean(invalidRange) ||
                filteredShipments.length === 0
              }
              onExport={handleExport}
              onError={(message) => onNotify?.(message, "error")}
            />

            <button
              type="button"
              onClick={onOpenCreate}
              className="flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-linear-to-r from-blue-500 to-blue-600 px-3 text-xs font-semibold text-white shadow-xs transition hover:from-blue-600 hover:to-blue-700 active:scale-95 sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              Create shipment
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <StateBox>
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="text-sm font-medium">Loading shipments...</p>
        </StateBox>
      ) : shipments.length === 0 ? (
        <StateBox icon={Truck}>
          <p className="font-medium text-slate-600">No shipments yet.</p>
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-1 inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first shipment
          </button>
        </StateBox>
      ) : filteredShipments.length === 0 ? (
        <StateBox icon={Search}>
          <p className="font-medium text-slate-600">
            No shipments match the selected filters.
          </p>
          <button
            type="button"
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="mt-1 inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </StateBox>
      ) : (
        <>
          {/* Mobile / Tablet Card View */}
          <div className="space-y-2 lg:hidden">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pagination.paginatedData.map((shipment, index) => (
                <div
                  key={shipment.id}
                  className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 px-1.5 text-[11px] font-bold text-blue-700">
                        {firstSrNo + index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {shipment.shipmentName || `Shipment #${shipment.id}`}
                        </p>
                        <p className="flex gap-3 text-xs text-slate-500">
                          <span>ID #{shipment.id}</span>
                          <span>Order #{getOrderId(shipment) ?? "—"}</span>
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniField label="Customer">
                      {shipment.customerName || "—"}
                      {shipment.customerMobile && (
                        <span className="block font-normal text-slate-500">
                          {shipment.customerMobile}
                        </span>
                      )}
                    </MiniField>
                    <MiniField label="Courier">
                      {shipment.companyName || "—"}
                      {shipment.trackingId && (
                        <span className="block font-normal text-slate-500">
                          {shipment.trackingId}
                        </span>
                      )}
                    </MiniField>
                    <MiniField label="Shipped by">
                      {shipment.employeeName || "—"}
                    </MiniField>
                    <MiniField label="Date">
                      {shipment.shipmentDate || "—"}
                    </MiniField>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <div>
                      <p className="text-[11px] text-slate-500">
                        Shipment cost
                      </p>
                      <p className="text-base font-extrabold text-slate-900">
                        {inr(shipment.shipmentCost)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {shipment.trackingLink && (
                        <a
                          href={shipment.trackingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Track
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleReceipt(shipment.id)}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95"
                      >
                        <FileText className="h-3 w-3" />
                        Receipt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReceiptDownload(shipment.id)}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95"
                      >
                        <Download className="h-3 w-3" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setShipmentToDelete(shipment)}
                        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white active:scale-95"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900">
              <span>Total ({filteredShipments.length} shipments)</span>
              <span>{inr(listedCostTotal)}</span>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:block">
            <table className="w-full table-fixed border-collapse text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 bg-blue-400 text-[11px] font-bold uppercase tracking-wide text-white">
                <tr>
                  <th className="w-[5%] px-2 py-2.5 text-center">Sr No</th>
                  <th className="w-[16%] px-2 py-2.5">Shipment</th>
                  <th className="w-[6%] px-2 py-2.5">Order</th>
                  <th className="w-[12%] px-2 py-2.5">Customer</th>
                  <th className="w-[16%] px-2 py-2.5">Courier / Tracking</th>
                  <th className="w-[10%] px-2 py-2.5">Employee</th>
                  <th className="w-[6%] px-2 py-2.5 text-right">Cost</th>
                  <th className="w-[9%] px-2 py-2.5">Date</th>
                  <th className="w-[10%] px-2 py-2.5 text-center">Status</th>
                  <th className="w-[8%] px-2 py-2.5 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {pagination.paginatedData.map((shipment, index) => (
                  <tr
                    key={shipment.id}
                    className="transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/60"
                  >
                    {/* Sr No */}
                    <td className="px-2 py-2 text-center font-semibold text-slate-500">
                      {firstSrNo + index + 1}
                    </td>

                    {/* Shipment Name & ID */}
                    <td className="px-2 py-2">
                      <p
                        className="truncate font-semibold text-slate-800"
                        title={
                          shipment.shipmentName || `Shipment #${shipment.id}`
                        }
                      >
                        {shipment.shipmentName || `Shipment #${shipment.id}`}
                      </p>
                      {/* <p className="text-[11px] text-slate-400">
                        ID #{shipment.id}
                      </p> */}
                    </td>

                    {/* Order ID */}
                    <td className="px-2 py-2 font-medium text-slate-700">
                      #{getOrderId(shipment) ?? "—"}
                    </td>

                    {/* Customer */}
                    <td className="px-2 py-2">
                      <p
                        className="truncate font-semibold text-slate-800"
                        title={shipment.customerName || "—"}
                      >
                        {shipment.customerName || "—"}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {shipment.customerMobile || ""}
                      </p>
                    </td>

                    {/* Courier / Tracking */}
                    <td className="px-2 py-2">
                      <p
                        className="truncate font-semibold text-slate-700"
                        title={shipment.companyName || "—"}
                      >
                        {shipment.companyName || "—"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        {shipment.trackingId && (
                          <span
                            className="truncate"
                            title={shipment.trackingId}
                          >
                            {shipment.trackingId}
                          </span>
                        )}
                        {shipment.trackingLink && (
                          <a
                            href={shipment.trackingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-blue-600 hover:underline"
                          >
                            Track
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Employee */}
                    <td className="px-2 py-2 font-medium text-slate-700">
                      <span
                        className="block truncate"
                        title={shipment.employeeName || "—"}
                      >
                        {shipment.employeeName || "—"}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="truncate px-2 py-2 text-right font-bold text-slate-800">
                      {inr(shipment.shipmentCost)}
                    </td>

                    {/* Date */}
                    <td className="truncate px-2 py-2 text-slate-600">
                      {shipment.shipmentDate || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-2 py-2 text-center">
                      <StatusBadge status={shipment.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleReceipt(shipment.id)}
                          className={`${iconBtn} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
                          title="Open receipt"
                          aria-label="Open receipt"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReceiptDownload(shipment.id)}
                          className={`${iconBtn} border-slate-200 bg-white text-slate-700 hover:bg-slate-100`}
                          title="Download receipt"
                          aria-label="Download receipt"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShipmentToDelete(shipment)}
                          className={`${iconBtn} border-red-200 bg-white text-red-600 hover:bg-red-600 hover:text-white`}
                          title="Delete shipment"
                          aria-label="Delete shipment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="border-t border-slate-300 bg-slate-100 text-xs font-bold text-slate-900">
                <tr>
                  <td
                    className="px-2 py-2"
                    colSpan={6}
                  >
                    Total ({filteredShipments.length} shipments)
                  </td>
                  <td className="truncate px-2 py-2 text-right text-emerald-700">
                    {inr(listedCostTotal)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.setCurrentPage}
            onItemsPerPageChange={pagination.setItemsPerPage}
          />
        </>
      )}
    </div>
  );
};

export default ShipmentList;
