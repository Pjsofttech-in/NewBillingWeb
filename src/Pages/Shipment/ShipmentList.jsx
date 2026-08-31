import {useMemo, useState} from "react";
import {
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Truck,
  XCircle,
  Filter,
  RotateCcw,
} from "lucide-react";

import Select from "../../Components/Form/Select";
import Input from "../../Components/Form/Input";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";

const STATUS_STYLES = {
  PREPARING: "bg-slate-100 text-slate-700",
  SHIPPED: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-amber-100 text-amber-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ShipmentList = ({
  shipments = [],
  isLoading = false,
  onOpenCreate,
  onDelete,
}) => {
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    timeframe: "ALL",
    company: "",
    fromDate: "",
    toDate: "",
  });

  const [shipmentToDelete, setShipmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      timeframe: "ALL",
      company: "",
      fromDate: "",
      toDate: "",
    });
  };

  const filteredShipments = useMemo(() => {
    const now = new Date();

    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    if (filters.timeframe === "7D") {
      startDate.setDate(startDate.getDate() - 6);
    }

    if (filters.timeframe === "30D") {
      startDate.setDate(startDate.getDate() - 29);
    }

    if (filters.timeframe === "1Y") {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const query = filters.search.toLowerCase().trim();

    return shipments.filter((shipment) => {
      const shipmentDate = shipment.shipmentDate
        ? new Date(`${shipment.shipmentDate}T00:00:00`)
        : null;

      const matchesSearch =
        !query ||
        shipment.shipmentName?.toLowerCase().includes(query) ||
        shipment.trackingId?.toLowerCase().includes(query) ||
        shipment.customerName?.toLowerCase().includes(query) ||
        shipment.customerMobile?.toLowerCase().includes(query) ||
        shipment.companyName?.toLowerCase().includes(query) ||
        String(shipment.order?.id || "").includes(query) ||
        String(shipment.id || "").includes(query);

      const matchesStatus =
        !filters.status || shipment.status === filters.status;

      const matchesCompany =
        !filters.company ||
        shipment.companyName
          ?.toLowerCase()
          .includes(filters.company.toLowerCase());

      const matchesTimeframe =
        filters.timeframe === "ALL" ||
        !shipmentDate ||
        shipmentDate >= startDate;

      const matchesFromDate =
        !filters.fromDate ||
        (shipmentDate &&
          shipmentDate >= new Date(`${filters.fromDate}T00:00:00`));

      const matchesToDate =
        !filters.toDate ||
        (shipmentDate &&
          shipmentDate <= new Date(`${filters.toDate}T23:59:59`));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCompany &&
        matchesTimeframe &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [shipments, filters]);

  const paginationKey = JSON.stringify(filters);

  const pagination = usePagination(filteredShipments, 10, paginationKey);

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
    <div className="space-y-4">
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

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">
              Filters
            </span>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {filteredShipments.length} Shipment
              {filteredShipments.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={onOpenCreate}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#0073b7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0867a0]"
            >
              <Plus className="h-4 w-4" />
              Create Shipment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search shipment, order, customer, tracking..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            {filters.search && (
              <button
                type="button"
                onClick={() => updateFilter("search", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status */}
          <Select
            name="shipmentStatus"
            placeholder="All statuses"
            register={() => ({
              value: filters.status,
              onChange: (e) => updateFilter("status", e.target.value),
            })}
            options={Object.keys(STATUS_STYLES).map((status) => ({
              value: status,
              label: status.replaceAll("_", " "),
            }))}
          />

          {/* Timeframe */}
          <Select
            name="shipmentTimeframe"
            register={() => ({
              value: filters.timeframe,
              onChange: (e) => updateFilter("timeframe", e.target.value),
            })}
            options={[
              {value: "ALL", label: "All Time"},
              {value: "TODAY", label: "Today"},
              {value: "7D", label: "Last 7 Days"},
              {value: "30D", label: "Last 30 Days"},
              {value: "1Y", label: "Last 1 Year"},
            ]}
          />

          {/* Company */}
          <Input
            name="companyFilter"
            placeholder="Courier / company"
            register={() => ({
              value: filters.company,
              onChange: (e) => updateFilter("company", e.target.value),
            })}
          />

          {/* From Date */}
          <Input
            name="fromDate"
            type="date"
            register={() => ({
              value: filters.fromDate,
              onChange: (e) => updateFilter("fromDate", e.target.value),
            })}
          />

          {/* To Date */}
          <Input
            name="toDate"
            type="date"
            register={() => ({
              value: filters.toDate,
              onChange: (e) => updateFilter("toDate", e.target.value),
            })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3.5">Shipment</th>
              <th className="px-4 py-3.5">Order</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Courier / Tracking</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="7"
                  className="py-10 text-center text-slate-500"
                >
                  Loading shipments...
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="py-14 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-10 w-10 stroke-1 text-slate-300" />

                    <p className="font-medium">No shipments found.</p>
                  </div>
                </td>
              </tr>
            ) : pagination.paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="py-10 text-center text-slate-500"
                >
                  No shipments match the selected filters.
                </td>
              </tr>
            ) : (
              pagination.paginatedData.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800">
                      {shipment.shipmentName || `Shipment #${shipment.id}`}
                    </p>

                    <p className="text-xs text-slate-400">#{shipment.id}</p>
                  </td>

                  <td className="px-4 py-3.5 font-medium text-slate-700">
                    #{shipment.order?.id ?? "—"}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-slate-800">
                        {shipment.customerName || "—"}
                      </span>

                      <span className="text-slate-500">
                        {shipment.customerMobile || ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-slate-700">
                        {shipment.companyName || "—"}
                      </span>

                      {shipment.trackingId && (
                        <span className="text-slate-500">
                          {shipment.trackingId}
                        </span>
                      )}

                      {shipment.trackingLink && (
                        <a
                          href={shipment.trackingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Track
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    {shipment.shipmentDate || "—"}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[shipment.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {shipment.status?.replaceAll("_", " ") || "—"}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setShipmentToDelete(shipment)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                      title="Delete Shipment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredShipments.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
          itemName="shipments"
        />
      )}
    </div>
  );
};

export default ShipmentList;
