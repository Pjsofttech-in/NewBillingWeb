import {useEffect, useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  Boxes,
  ArrowLeftRight,
  History,
  IndianRupee,
  PackagePlus,
  ShoppingBag,
  Tag,
  TrendingUp,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {getProductBatches, fetchStockHistory} from "../../api/productApi";
import {fetchAttributesByProductType} from "../../api/attributeApi";

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {maximumFractionDigits: 2})}`;

const TABS = [
  {id: "overview", label: "Overview", icon: Boxes},
  {id: "pricing", label: "Pricing & GST", icon: IndianRupee},
  {id: "history", label: "Purchase history", icon: History},
  {id: "movements", label: "Stock movements", icon: ArrowLeftRight},
];

const ProductDetailsModal = ({
  isOpen,
  product,
  onClose,
  onHistory,
  onAddStock,
  onDelete,
  isCovered = false, // true while History / Add stock / Delete modal is on top
}) => {
  const [tab, setTab] = useState("overview");

  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyError,
    error: historyErrorObj,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["productBatches", product?.id],
    queryFn: () => getProductBatches(product.id),
    enabled: Boolean(isOpen && product?.id),
  });

  // Every stock movement (initial stock, restocks, order deductions / restores)
  const {
    data: movements = [],
    isLoading: movementsLoading,
    isError: movementsError,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: ["stockHistory", product?.id],
    queryFn: () => fetchStockHistory(product.id),
    staleTime: 0, // always fresh when the tab is opened
    enabled: Boolean(isOpen && product?.id && tab === "movements"),
  });

  const {data: attributes = []} = useQuery({
    queryKey: ["attributes", product?.productType?.id],
    queryFn: () => fetchAttributesByProductType(product.productType.id),
    enabled: Boolean(isOpen && product?.productType?.id),
  });

  const [prevProductKey, setPrevProductKey] = useState(null);
  const currentProductKey = isOpen && product?.id ? product.id : null;
  if (prevProductKey !== currentProductKey) {
    setPrevProductKey(currentProductKey);
    if (isOpen) {
      setTab("overview");
    }
  }

  // Escape closes (unless another modal is on top) + lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !isCovered) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isCovered, onClose]);

  // Newest purchase first.
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => Number(b.id) - Number(a.id)),
    [history],
  );

  if (!isOpen || !product) return null;

  const stock = product.stock ?? 0;
  const sold = product.totalSold ?? 0;
  const totalStock = stock + sold; // available + sold
  const remaining = stock; // available stock
  const storePrice = product.storePrice ?? 0;
  const customerPrice = product.customerPrice ?? 0;
  const margin = customerPrice - storePrice;
  const marginPct = storePrice > 0 ? (margin / storePrice) * 100 : 0;
  const stockAmount = Math.round(stock * customerPrice * 100) / 100; // Avl stock x sell price
  const buyTotal = Math.round(stock * storePrice * 100) / 100; // Avl stock x buy price
  const gst = product.totalGstPercentage ?? 0;
  const unit = product.unitType?.unitType || product.unitType?.unitName || "";
  const stockPct =
    totalStock > 0
      ? Math.min(100, Math.max(0, Math.round((remaining / totalStock) * 100)))
      : 0;

  const status =
    stock <= 0
      ? {
          label: "Out of stock",
          chip: "bg-red-50 text-red-700 border-red-200",
          bar: "bg-red-500",
        }
      : stock <= 10
        ? {
            label: "Low stock",
            chip: "bg-amber-50 text-amber-700 border-amber-200",
            bar: "bg-amber-500",
          }
        : {
            label: "In stock",
            chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
            bar: "bg-emerald-500",
          };

  const marginTone =
    margin > 0 ? "text-emerald-700" : margin < 0 ? "text-red-600" : "text-slate-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => {
        // click on the dark backdrop only
        if (e.target === e.currentTarget && !isCovered) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details of ${product.productName}`}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] sm:max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* ============ HEADER ============ */}
        <div className="shrink-0 px-4 sm:px-5 pt-4 pb-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 break-words leading-snug">
              {product.productName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                className={`px-2 py-0.5 rounded-full border font-semibold ${status.chip}`}
              >
                {status.label}
              </span>
              {product.brand?.brandName && (
                <span className="px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 font-semibold">
                  {product.brand.brandName}
                </span>
              )}
              {product.productType?.typeName && (
                <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold">
                  {product.productType.typeName}
                </span>
              )}
              {product.active === false && (
                <span className="px-2 py-0.5 rounded-full border border-slate-300 bg-slate-100 text-slate-600 font-semibold">
                  Inactive
                </span>
              )}
              <span className="text-slate-400 font-medium">ID #{product.id}</span>
            </div>
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

        {/* ============ ACTION BAR (always visible) ============ */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 border-b bg-white grid grid-cols-3 sm:flex sm:items-center gap-2">
          {onHistory && (
            <button
              type="button"
              onClick={onHistory}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm hover:from-blue-600 hover:to-blue-700 hover:shadow-md active:scale-95 transition cursor-pointer"
            >
              <History size={16} />
              <span className="truncate">History</span>
            </button>
          )}
          {onAddStock && (
            <button
              type="button"
              onClick={onAddStock}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-95 transition cursor-pointer"
            >
              <PackagePlus size={16} />
              <span className="truncate">Add stock</span>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-red-600 bg-white border border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 active:scale-95 transition cursor-pointer sm:ml-auto"
            >
              <Trash2 size={16} />
              <span className="truncate">Delete</span>
            </button>
          )}
        </div>

        {/* ============ TABS ============ */}
        <div
          role="tablist"
          className="shrink-0 flex gap-1 px-3 sm:px-5 border-b bg-white "
        >
          {TABS.map(({id, label, icon: Icon}) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer ${
                  active
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={15} />
                {label}
                {id === "history" && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold ${
                      active
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {history.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ============ BODY (scrolls) ============ */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-5 space-y-4">
          {/* ---------- OVERVIEW ---------- */}
          {tab === "overview" && (
            <>
              {/* Key numbers at a glance */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div className="col-span-2 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Boxes size={14} className="text-blue-600" />
                    Available stock
                  </div>
                  <p className="mt-1 text-xl font-extrabold text-slate-900 leading-tight">
                    {remaining}
                    <span className="ml-1 text-xs font-medium text-slate-500">
                      {unit} of {totalStock}
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status.bar}`}
                      style={{width: `${stockPct}%`}}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {stockPct}% left
                  </p>
                </div>

                <Kpi
                  icon={Wallet}
                  iconClass="text-amber-600"
                  label="Buy price"
                  value={money(storePrice)}
                  hint="per unit"
                />
                <Kpi
                  icon={Tag}
                  iconClass="text-emerald-600"
                  label="Sell price"
                  value={money(customerPrice)}
                  hint="per unit"
                />
                <Kpi
                  icon={TrendingUp}
                  iconClass={marginTone}
                  label="Margin"
                  value={money(margin)}
                  valueClass={marginTone}
                  hint={`${marginPct.toFixed(1)}% per unit`}
                />
                <Kpi
                  icon={ShoppingBag}
                  iconClass="text-violet-600"
                  label="Total sold"
                  value={sold}
                  hint={`${money(product.totalSoldAmount)} earned`}
                />
              </div>

              <Card title="Product details">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  <Field label="Product type" value={product.productType?.typeName || "N/A"} />
                  {product.subCategory?.subCategoryName && (
                    <Field label="Sub category" value={product.subCategory.subCategoryName} />
                  )}
                  <Field label="Brand" value={product.brand?.brandName || "N/A"} />
                  <Field label="Vendor" value={product.vendor?.vendorName || "N/A"} />
                  <Field label="Unit type" value={unit || "N/A"} />
                  <Field label="Added on" value={product.productAddedDate || "N/A"} />
                  <Field label="Status" value={product.active === false ? "Inactive" : "Active"} />
                </div>
              </Card>

              <Card title="Stock & value">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <Field label="Total stock" value={totalStock} />
                  <Field label="Available" value={remaining} />
                  <Field label="Sold" value={sold} />
                  <Field label="Total sold amount" value={money(product.totalSoldAmount)} />
                  <Field label="Buy price total" value={money(buyTotal)} />
                  <Field label="Remaining stock value" value={money(stockAmount)} />
                </div>
              </Card>

              <Card title="Product type attributes">
                {attributes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No attributes are set up for this product type.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attributes.map((attribute) => (
                      <span
                        key={attribute.id}
                        className="px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-800 text-xs font-semibold"
                      >
                        {attribute.name ||
                          attribute.attributeName ||
                          `Attribute #${attribute.id}`}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ---------- PRICING & GST ---------- */}
          {tab === "pricing" && (
            <>
              <Card title="How the price is built (per unit)">
                <div className="divide-y divide-slate-100 text-sm">
                  <Row label="Product MRP" value={money(product.productMrp)} />
                  <Row
                    label={`Vendor discount (${product.vendorDiscountPercentage ?? 0}%)`}
                    value={`− ${money(product.vendorDiscountAmount)}`}
                    valueClass="text-red-600"
                  />
                  <Row
                    label="Buy price"
                    value={money(storePrice)}
                    valueClass="text-blue-700"
                    strong
                  />
                  <Row
                    label="Sell price"
                    value={money(customerPrice)}
                    valueClass="text-emerald-700"
                    strong
                  />
                  <Row
                    label={`Margin (${marginPct.toFixed(1)}%)`}
                    value={`${margin >= 0 ? "+ " : "− "}${money(Math.abs(margin))}`}
                    valueClass={marginTone}
                    strong
                  />
                </div>
              </Card>

              <Card
                title="GST"
                right={
                  <span className="text-xs font-semibold text-slate-600">
                    Total GST:{" "}
                    <span className="text-emerald-700 text-sm font-bold">
                      {product.gstApplicable ? `${gst}%` : "Not applicable"}
                    </span>
                  </span>
                }
              >
                {!product.gstApplicable ? (
                  <p className="text-sm text-slate-500">
                    GST is not applied on this product.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <GstChip label="CGST" applied={product.applyCgst} pct={product.cgstPercentage} />
                    <GstChip label="SGST" applied={product.applySgst} pct={product.sgstPercentage} />
                    <GstChip label="UGST" applied={product.applyUgst} pct={product.ugstPercentage} />
                    <GstChip label="IGST" applied={product.applyIgst} pct={product.igstPercentage} />
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ---------- PURCHASE HISTORY ---------- */}
          {tab === "history" && (
            <Card
              title="Purchase history"
              right={
                <span className="text-xs font-semibold text-slate-500">
                  {history.length} {history.length === 1 ? "entry" : "entries"} · newest first
                </span>
              }
            >
              {historyLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Loading purchase history...
                </div>
              ) : historyError ? (
                <div className="py-6 text-center rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-semibold text-red-600">
                    Could not load purchase history
                  </p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    {historyErrorObj?.response?.data?.message ||
                      historyErrorObj?.message ||
                      "Something went wrong."}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchHistory()}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : sortedHistory.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No purchases recorded yet. Use <b>Add stock</b> to add the first one.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600 border-b">
                        <tr>
                          <th className="p-2.5 text-left font-semibold">Date</th>
                          <th className="p-2.5 text-left font-semibold">Batch</th>
                          <th className="p-2.5 text-left font-semibold">Vendor</th>
                          <th className="p-2.5 text-center font-semibold">Bought</th>
                          <th className="p-2.5 text-center font-semibold">Left</th>
                          <th className="p-2.5 text-right font-semibold">Buy price</th>
                          <th className="p-2.5 text-right font-semibold">Sell price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedHistory.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="p-2.5 whitespace-nowrap">{entry.receivedDate || "—"}</td>
                            <td className="p-2.5 font-semibold">{entry.batchNumber || "—"}</td>
                            <td className="p-2.5">{entry.vendor?.vendorName || "N/A"}</td>
                            <td className="p-2.5 text-center">{entry.initialQuantity ?? 0}</td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-block min-w-8 rounded-full px-2 py-0.5 text-xs font-bold ${
                                  (entry.availableQuantity ?? 0) > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {entry.availableQuantity ?? 0}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-semibold text-blue-700">
                              {money(entry.purchasePrice)}
                            </td>
                            <td className="p-2.5 text-right font-semibold text-emerald-700">
                              {money(entry.sellingPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-2">
                    {sortedHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              Batch {entry.batchNumber || "—"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.receivedDate || "—"} · {entry.vendor?.vendorName || "N/A"}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                              (entry.availableQuantity ?? 0) > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {entry.availableQuantity ?? 0} left
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded bg-slate-50 py-1">
                            <p className="text-slate-500">Bought</p>
                            <p className="font-bold text-slate-900">{entry.initialQuantity ?? 0}</p>
                          </div>
                          <div className="rounded bg-slate-50 py-1">
                            <p className="text-slate-500">Buy</p>
                            <p className="font-bold text-blue-700">{money(entry.purchasePrice)}</p>
                          </div>
                          <div className="rounded bg-slate-50 py-1">
                            <p className="text-slate-500">Sell</p>
                            <p className="font-bold text-emerald-700">{money(entry.sellingPrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ---------- STOCK MOVEMENTS ---------- */}
          {tab === "movements" && (
            <Card
              title="Stock movements"
              right={
                <span className="text-xs font-semibold text-slate-500">
                  {movements.length} {movements.length === 1 ? "entry" : "entries"} · newest first
                </span>
              }
            >
              {movementsLoading ? (
                <div className="py-8 text-center text-sm text-slate-500">Loading stock movements...</div>
              ) : movementsError ? (
                <div className="py-6 text-center rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm font-semibold text-red-600">Could not load stock movements</p>
                  <button
                    type="button"
                    onClick={() => refetchMovements()}
                    className="mt-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No stock movements yet.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600 border-b">
                      <tr>
                        <th className="p-2.5 text-left font-semibold">Date</th>
                        <th className="p-2.5 text-left font-semibold">Type</th>
                        <th className="p-2.5 text-left font-semibold">Vendor</th>
                        <th className="p-2.5 text-center font-semibold">Before</th>
                        <th className="p-2.5 text-center font-semibold">Change</th>
                        <th className="p-2.5 text-center font-semibold">After</th>
                        <th className="p-2.5 text-right font-semibold">Buy price</th>
                        <th className="p-2.5 text-left font-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...movements]
                        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")) || (b.id ?? 0) - (a.id ?? 0))
                        .map((m) => {
                          const change = Number(m.addedQuantity || 0);
                          return (
                            <tr key={m.id} className="hover:bg-slate-50">
                              <td className="p-2.5 whitespace-nowrap">
                                {m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}
                              </td>
                              <td className="p-2.5 font-semibold">
                                {String(m.transactionType || "—").replaceAll("_", " ")}
                              </td>
                              <td className="p-2.5">{m.vendor?.vendorName || "—"}</td>
                              <td className="p-2.5 text-center">{m.previousStock ?? "—"}</td>
                              <td
                                className={`p-2.5 text-center font-bold ${
                                  change < 0 ? "text-red-600" : "text-emerald-700"
                                }`}
                              >
                                {change > 0 ? `+${change}` : change}
                              </td>
                              <td className="p-2.5 text-center">{m.newStock ?? "—"}</td>
                              <td className="p-2.5 text-right text-blue-700 font-semibold">
                                {m.storePrice != null ? money(m.storePrice) : "—"}
                              </td>
                              <td className="p-2.5 text-xs text-slate-600">{m.remarks || "—"}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ============ FOOTER ============ */}
        <div className="shrink-0 border-t bg-white px-4 sm:px-5 py-2.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-6 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- small building blocks ---------- */

const Card = ({title, right = null, children}) => (
  <section className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Kpi = ({
  icon: Icon,
  iconClass = "text-slate-500",
  label,
  value,
  valueClass = "text-slate-900",
  hint,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <Icon size={14} className={iconClass} />
      {label}
    </div>
    <p className={`mt-1 text-xl font-extrabold leading-tight truncate ${valueClass}`} title={String(value)}>
      {value}
    </p>
    <p className="mt-1 text-[11px] text-slate-500 truncate">{hint}</p>
  </div>
);

const Field = ({label, value}) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 min-w-0">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{value}</p>
  </div>
);

const Row = ({label, value, valueClass = "text-slate-900", strong = false}) => (
  <div className="flex items-center justify-between gap-3 py-2.5">
    <span className={strong ? "font-semibold text-slate-800" : "text-slate-600"}>{label}</span>
    <span className={`${strong ? "text-base font-extrabold" : "font-semibold"} ${valueClass}`}>
      {value}
    </span>
  </div>
);

const GstChip = ({label, applied, pct}) => (
  <div
    className={`rounded-lg border px-3 py-2 ${
      applied ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
    }`}
  >
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`mt-0.5 text-sm font-bold ${applied ? "text-emerald-700" : "text-slate-400"}`}>
      {applied ? `${pct ?? 0}%` : "Not applied"}
    </p>
  </div>
);

export default ProductDetailsModal;