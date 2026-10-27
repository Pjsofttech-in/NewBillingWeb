
// // Color tones
// const TONES = {
//   slate: {box: "bg-slate-50 border-slate-200", value: "text-slate-800"},
//   blue: {box: "bg-blue-50 border-blue-200", value: "text-blue-700"},
//   violet: {box: "bg-violet-50 border-violet-200", value: "text-violet-700"},
//   amber: {box: "bg-amber-50 border-amber-200", value: "text-amber-700"},
//   indigo: {box: "bg-indigo-50 border-indigo-200", value: "text-indigo-700"},
//   emerald: {box: "bg-emerald-50 border-emerald-200", value: "text-emerald-700"},
// };

// const StatCard = ({label, value, tone = "slate"}) => {
//   const t = TONES[tone] || TONES.slate;


//   const pagination = usePagination(products, 25);


//   const showToast = (message, type = "success") => setToast({message, type});


//       {/* Toolbar */}
//       {toolbar}


// export default ProductList;

import {useMemo, useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteProduct} from "../../api/productApi";
import Toast from "../../Components/Toast";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import UpdateStockModal from "./UpdateStockModal";
import ProductDetailsModal from "./ProductDetailsModal";
import BatchListModal from "./BatchListModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../Hooks/usePagination";
import {inr, round2} from "../../utils/vendorPricing";

// Color tones
const TONES = {
  slate: {box: "bg-slate-50 border-slate-200", value: "text-slate-800"},
  blue: {box: "bg-blue-50 border-blue-200", value: "text-blue-700"},
  violet: {box: "bg-violet-50 border-violet-200", value: "text-violet-700"},
  amber: {box: "bg-amber-50 border-amber-200", value: "text-amber-700"},
  indigo: {box: "bg-indigo-50 border-indigo-200", value: "text-indigo-700"},
  emerald: {box: "bg-emerald-50 border-emerald-200", value: "text-emerald-700"},
};

const StatCard = ({label, value, tone = "slate"}) => {
  const t = TONES[tone] || TONES.slate;

  return (
    <div
      className={`flex flex-row items-center justify-between rounded-lg border px-0.5 py-2 text-center shadow-xs transition hover:shadow-md ${t.box}`}
      title={`${label}: ${value}`}
    >
      <span className="w-full truncate  text-[12px] font-medium text-slate-800">
        {label}
      </span>
      <span className={`w-full  text-xs font-bold leading-tight ${t.value}`}>
        {value}
      </span>
    </div>
  );
};

// ---- Row values, always calculated from the stored fields ----
// (the backend's calculated fields can be empty, so we don't depend on them)
const num = (v) => Number(v) || 0;
const availableStock = (p) => num(p.stock ?? p.remainingStock);
const soldQty = (p) => num(p.totalSold);
const totalStockQty = (p) => availableStock(p) + soldQty(p);
const buyPriceOf = (p) => {
  if (p.storePrice != null) return num(p.storePrice);
  const mrp = num(p.productMrp);
  return mrp - (mrp * num(p.vendorDiscountPercentage)) / 100;
};
const sellPriceOf = (p) => num(p.customerPrice ?? p.price);
const buyTotalOf = (p) => round2(availableStock(p) * buyPriceOf(p)); // Buy Total = Avl Stk x Buy Price
const stockAmountOf = (p) => round2(availableStock(p) * sellPriceOf(p)); // Stk Amt = Avl Stk x Sell Price

const NameButton = ({item, onOpen, className = ""}) => (
  <button
    type="button"
    onClick={() => onOpen(item.id)}
    title="View product details"
    className={`text-left font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer ${className}`}
  >
    {item.productName}
  </button>
);

const ProductList = ({products = [], toolbar = null}) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToUpdateStock, setProductToUpdateStock] = useState(null);
  const [productForBatches, setProductForBatches] = useState(null);
  const [detailsId, setDetailsId] = useState(null);

  const productForDetails = useMemo(
    () => products.find((p) => p.id === detailsId) || null,
    [products, detailsId],
  );

  const pagination = usePagination(products, 25);

  const totals = useMemo(() => {
    const t = {
      count: products.length,
      totalStock: 0,
      remaining: 0,
      sold: 0,
      buyTotal: 0,
      stockAmount: 0,
      soldAmount: 0,
    };
    for (const p of products) {
      t.totalStock += totalStockQty(p);
      t.remaining += availableStock(p);
      t.sold += soldQty(p);
      t.buyTotal += buyPriceOf(p) * availableStock(p);
      t.stockAmount += sellPriceOf(p) * availableStock(p);
      t.soldAmount += num(p.totalSoldAmount);
    }
    t.buyTotal = round2(t.buyTotal);
    t.stockAmount = round2(t.stockAmount);
    t.soldAmount = round2(t.soldAmount);
    return t;
  }, [products]);

  const showToast = (message, type = "success") => setToast({message, type});

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products"]});
      showToast("Product deleted!", "success");
      setProductToDelete(null);
      setDetailsId(null);
    },
    onError: (err) => {
      showToast("Delete failed: " + (err.message || "Error"), "error");
      setProductToDelete(null);
    },
  });

  const detailsCovered = Boolean(
    productToDelete || productToUpdateStock || productForBatches,
  );

  const modals = (
    <>
      <ProductDetailsModal
        isOpen={Boolean(productForDetails)}
        product={productForDetails}
        isCovered={detailsCovered}
        onClose={() => setDetailsId(null)}
        onHistory={() => setProductForBatches(productForDetails)}
        onAddStock={() => setProductToUpdateStock(productForDetails)}
        onDelete={() => setProductToDelete(productForDetails)}
      />

      <BatchListModal
        isOpen={Boolean(productForBatches)}
        product={productForBatches}
        onClose={() => setProductForBatches(null)}
      />

      <UpdateStockModal
        isOpen={Boolean(productToUpdateStock)}
        product={productToUpdateStock}
        onClose={() => setProductToUpdateStock(null)}
        onSuccess={(updated, planError) =>
          planError
            ? showToast(
                `Stock updated, but the installment plan failed: ${planError}. Create it from Vendor Bills.`,
                "error",
              )
            : showToast("Stock updated!", "success")
        }
      />

      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        itemName={productToDelete?.productName}
        onConfirm={() =>
          productToDelete && deleteMutation.mutate(productToDelete.id)
        }
        onCancel={() => setProductToDelete(null)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );

  const toastEl = toast && (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );

  if (products.length === 0) {
    return (
      <div className="w-full m-0 p-0 space-y-1.5">
        {toastEl}
        {modals}
        {toolbar}
        <div className="w-full text-center py-8 bg-white border-y border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            No products found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full m-0 p-0 space-y-1.5">
      {toastEl}
      {modals}

      {/* Toolbar */}
      {toolbar}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        <StatCard
          label="Stock"
          value={totals.totalStock}
          tone="slate"
        />
        <StatCard
          label="Avl Stock"
          value={totals.remaining}
          tone="blue"
        />
        <StatCard
          label="Sold"
          value={totals.sold}
          tone="violet"
        />
        <StatCard
          label="Buy Price"
          value={inr(totals.buyTotal)}
          tone="amber"
        />
        <StatCard
          label="Stock Amt"
          value={inr(totals.stockAmount)}
          tone="indigo"
        />
        <StatCard
          label="Sold Amt"
          value={inr(totals.soldAmount)}
          tone="emerald"
        />
      </div>

      {/* Mobile view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:hidden p-0.5">
        {pagination.paginatedData.map((item, rowIndex) => {
          const serialNo = pagination.startIndex + rowIndex + 1;
          const productMrp = item.productMrp || 0;
          const storePrice = buyPriceOf(item);
          const customerPrice = sellPriceOf(item);
          const gst = item.totalGstPercentage ?? item.gstPercentage ?? 0;
          const stock = availableStock(item);

          return (
            <div
              key={item.id}
              className="bg-white p-2 rounded border border-slate-200 space-y-1.5 text-[11px]"
            >
              <div className="flex justify-between items-start gap-1">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-500 font-bold">
                    #{serialNo}
                  </span>
                  <h3 className="text-xs truncate">
                    <NameButton
                      onOpen={setDetailsId}
                      item={item}
                      className="max-w-full truncate"
                    />
                  </h3>
                </div>
              </div>

              <div className="border-t border-b border-slate-100 py-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Buy Price:</span>
                  <span className="font-bold text-blue-700">
                    {storePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MRP:</span>
                  <span className="font-bold text-slate-700">
                    {productMrp.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sell Price:</span>
                  <span className="font-bold text-emerald-600">
                    {customerPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-600">
                <span>
                  Stock: <strong>{stock}</strong>
                </span>
                <span>
                  Sold: <strong>{soldQty(item)}</strong>
                </span>
                <span>{item.gstApplicable ? `${gst}% GST` : "No GST"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Compact Table View */}
      <div className="hidden lg:block w-full bg-white border-y border-slate-200 overflow-hidden">
        <table className="w-full table-fixed text-left text-[11px] text-slate-700 border-collapse">
          <thead className="border-b border-slate-200 text-[10px] font-bold uppercase bg-blue-400 text-white">
            <tr>
              <th className="w-[3%] px-1 py-1.5 text-center">ID</th>
              <th className="w-[12%] px-1 py-1.5">Product Name</th>
              <th className="w-[8%] px-1 py-1.5 text-right">MRP</th>
              <th className="w-[7%] px-1 py-1.5 text-right">Buy Price</th>
              <th className="w-[7%] px-1 py-1.5 text-right">Sell Price</th>
              <th className="w-[5%] px-1 py-1.5 text-right">GST</th>
              <th className="w-[6%] px-1 py-1.5 text-right">Total Stk</th>
              <th className="w-[6%] px-1 py-1.5 text-right">Avl Stk</th>
              <th className="w-[6%] px-1 py-1.5 text-right">Sold</th>
              <th className="w-[10%] px-1 py-1.5">Vendor</th>
              <th className="w-[9%] px-1 py-1.5 text-right">Buy Total</th>
              <th className="w-[9%] px-1 py-1.5 text-right">Stk Amt</th>
              <th className="w-[10%] px-1 py-1.5 text-right">Sold Amt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pagination.paginatedData.map((item, rowIndex) => {
              const productMrp = item.productMrp || 0;
              const storePrice = buyPriceOf(item);
              const customerPrice = sellPriceOf(item);
              const stock = availableStock(item);

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-1 py-1 text-center font-semibold text-slate-400">
                    {pagination.startIndex + rowIndex + 1}
                  </td>
                  <td className="px-1 py-1 truncate">
                    <NameButton
                      onOpen={setDetailsId}
                      item={item}
                      className="truncate block w-full text-[11px]"
                    />
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {inr(productMrp)}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-blue-700 truncate">
                    {inr(storePrice)}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {inr(customerPrice)}
                  </td>
                  <td className="px-1 py-1 text-right text-slate-600 truncate">
                    {item.gstApplicable
                      ? `${item.totalGstPercentage ?? item.gstPercentage ?? 0}%`
                      : "—"}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {totalStockQty(item)}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {stock}{" "}
                    <span className="text-[9px] text-slate-400">
                      {item.unitType?.unitType || ""}
                    </span>
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {soldQty(item)}
                  </td>
                  <td className="px-1 py-1 text-slate-700 text-[11.5px] truncate">
                    {item.vendor?.vendorName || "N/A"}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-blue-700 truncate">
                    {inr(buyTotalOf(item))}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-slate-800 truncate">
                    {inr(stockAmountOf(item))}
                  </td>
                  <td className="px-1 py-1 text-right font-semibold text-emerald-700 truncate">
                    {inr(item.totalSoldAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 border-t border-slate-300 text-[11px] font-semibold text-slate-900">
            <tr>
              <td
                className="px-1 py-1 truncate"
                colSpan={6}
              >
                Total ({totals.count} products)
              </td>
              <td className="px-1 py-1 text-right truncate">
                {totals.totalStock}
              </td>
              <td className="px-1 py-1 text-right truncate">
                {totals.remaining}
              </td>
              <td className="px-1 py-1 text-right truncate">{totals.sold}</td>
              <td className="px-1 py-1" />
              <td className="px-1 py-1 text-right text-blue-700 truncate">
                {inr(totals.buyTotal)}
              </td>
              <td className="px-1 py-1 text-right truncate">
                {inr(totals.stockAmount)}
              </td>
              <td className="px-1 py-1 text-right text-emerald-700 truncate">
                {inr(totals.soldAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="px-1 py-0.5">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
        />
      </div>
    </div>
  );
};

export default ProductList;
