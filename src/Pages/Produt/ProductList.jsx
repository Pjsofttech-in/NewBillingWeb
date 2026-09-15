import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteProduct} from "../../api/productApi";
import Toast from "../../Components/Toast";
import DeleteConfirmModal from "../../Components/DeleteConfirmModal";
import UpdateStockModal from "./UpdateStockModal";
import ProductDetailsModal from "./ProductDetailsModal";
import BatchListModal from "./BatchListModal";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";

const ProductList = ({products = []}) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productToUpdateStock, setProductToUpdateStock] = useState(null);
  const [productForDetails, setProductForDetails] = useState(null);
  const [productForBatches, setProductForBatches] = useState(null);

  const pagination = usePagination(products, 10);

  const showToast = (message, type = "success") => setToast({message, type});

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products"]});
      showToast("Product deleted!", "success");
      setProductToDelete(null);
    },
    onError: (err) => {
      showToast("Delete failed: " + (err.message || "Error"), "error");
      setProductToDelete(null);
    },
  });

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-base text-gray-500 font-medium">
          No products found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        itemName={productToDelete?.productName}
        onConfirm={() =>
          productToDelete && deleteMutation.mutate(productToDelete.id)
        }
        onCancel={() => setProductToDelete(null)}
        isLoading={deleteMutation.isPending}
      />

      <UpdateStockModal
        isOpen={Boolean(productToUpdateStock)}
        product={productToUpdateStock}
        onClose={() => setProductToUpdateStock(null)}
        onSuccess={() => showToast("Stock updated!", "success")}
      />

      <ProductDetailsModal
        isOpen={Boolean(productForDetails)}
        product={productForDetails}
        onClose={() => setProductForDetails(null)}
      />

      <BatchListModal
        isOpen={Boolean(productForBatches)}
        product={productForBatches}
        onClose={() => setProductForBatches(null)}
      />

      {/* MOBILE CARD VIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {pagination.paginatedData.map((item) => {
          const mrp = item.mrp || 0;
          const vendorDisc = item.vendorDiscountPercentage || 0;
          const storePrice = item.storePrice ?? mrp - (mrp * vendorDisc) / 100;
          const customerPrice = item.customerPrice ?? item.price ?? 0;
          const gst = item.totalGstPercentage ?? item.gstPercentage ?? 0;
          const margin = customerPrice - storePrice;
          const stock = item.stock ?? 0;
          const stockStatus =
            stock <= 0
              ? { label: "Out of stock", className: "bg-red-50 text-red-700 border-red-200" }
              : stock <= 10
                ? { label: "Low stock", className: "bg-amber-50 text-amber-700 border-amber-200" }
                : { label: "In stock", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };

          return (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 text-sm"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 font-bold">
                    #{item.id}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base truncate">
                    {item.productName}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                    {item.brand?.brandName && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold border border-blue-100">
                        {item.brand.brandName}
                      </span>
                    )}
                    {item.productType?.typeName && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-semibold border border-gray-200">
                        {item.productType.typeName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setProductForDetails(item)}
                    className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1.5 rounded-md hover:bg-blue-100 transition"
                  >
                    View
                  </button>
                  {/* Mobile View - History Button */}
                  <button onClick={() => setProductForBatches(item)} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1.5 rounded-md hover:bg-indigo-100 transition">History</button>
                  <button
                    onClick={() => setProductToUpdateStock(item)}
                    className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-md hover:bg-emerald-100 transition"
                  >
                    +Stock
                  </button>
                  <button
                    onClick={() => setProductToDelete(item)}
                    className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-1.5 rounded-md hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t border-b border-gray-100 py-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Buy Price ({vendorDisc}% off):</span>
                  <span className="font-bold text-blue-700 text-sm">
                    ₹{storePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Product MRP:</span>
                  <span className="font-bold text-slate-700 text-sm">
                    ₹{Number(item.productMrp || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Sell Price:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ₹{customerPrice.toLocaleString()}
                  </span>
                </div>
                {margin > 0 && (
                  <div className="text-right text-xs text-emerald-700 font-bold">
                    Margin: +₹{margin.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>
                  Stock:{" "}
                  <strong className="text-gray-900 font-bold">
                    {item.stock ?? 0} {item.unitType?.unitType || ""}
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${stockStatus.className}`}>
                    {stockStatus.label}
                  </span>
                  <span className="font-semibold text-gray-700">
                    {item.gstApplicable ? `${gst}% GST` : "No GST"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-800  uppercase text-xs tracking-wider font-bold">
            <tr>
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Buy Price</th>
              <th className="px-3 py-3">Product MRP</th>
              <th className="px-3 py-3">Sell Price</th>
              <th className="px-3 py-3">GST</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Vendor</th>
              <th className="px-3 py-3">Total</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagination.paginatedData.map((item) => {
              const mrp = item.mrp || 0;
              const vendorDisc = item.vendorDiscountPercentage || 0;
              const storePrice =
                item.storePrice ?? mrp - (mrp * vendorDisc) / 100;
              const customerPrice = item.customerPrice ?? item.price ?? 0;
              const gst = item.totalGstPercentage ?? item.gstPercentage ?? 0;
              const margin = customerPrice - storePrice;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/80 transition-colors"
                >
                  <td className="px-3 py-3 font-bold text-gray-500">
                    #{item.id}
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-bold text-gray-900 truncate max-w-40 text-sm">
                      {item.productName}
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs mt-1">
                      {item.brand?.brandName && (
                        <span className="px-1.5 py-0.5 text-blue-700 bg-blue-50 rounded font-semibold border border-blue-100">
                          {item.brand.brandName}
                        </span>
                      )}
                      {item.productType?.typeName && (
                        <span className="px-1.5 py-0.5 text-gray-700 bg-gray-100 rounded font-semibold border border-gray-200">
                          {item.productType.typeName}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-bold text-blue-700 text-sm">
                      ₹{storePrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 font-medium">
                      MRP ₹{mrp.toLocaleString()} (
                      <span className="text-emerald-600 font-bold">
                        {vendorDisc}% off
                      </span>
                      )
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-bold text-gray-900 text-sm">
                      ₹{Number(item.productMrp || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Actual printed MRP</div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-bold text-gray-900 text-sm">
                      ₹{customerPrice.toLocaleString()}
                    </div>
                    {margin !== 0 && (
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          margin > 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        +{margin.toLocaleString()} margin
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {item.gstApplicable ? (
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200">
                        {gst}% GST
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">
                        None
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <span className="font-bold text-gray-900 text-sm block">
                     {item.stock ?? 0} {item.unitType?.unitType || ""}
                    </span>
                    {/* <span className={`inline-block mt-1 px-1.5 py-0.5 rounded border text-[10px] font-bold ${stockStatus.className}`}>
                      {stockStatus.label}
                    </span> */}
                  </td>

                  <td className="px-3 py-3 text-gray-800 text-xs font-medium max-w-28 truncate">
                    {item.vendor?.vendorName || "N/A"}
                  </td>

                  <td className="px-3 py-3 font-bold text-gray-900 text-sm">
                    ₹
                    {(
                      item.totalAmount ?? customerPrice * (item.stock || 0)
                    ).toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setProductForDetails(item)}
                        className="text-xs font-semibold text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        View
                      </button>
                      {/* Desktop View - History Button */}
                      <button onClick={() => setProductForBatches(item)} className="text-xs font-semibold text-indigo-700 border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition">History</button>
                      <button
                        onClick={() => setProductToUpdateStock(item)}
                        className="text-xs font-semibold text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
                      >
                        +Stock
                      </button>
                      <button
                        onClick={() => setProductToDelete(item)}
                        className="text-xs font-semibold text-red-600 border  border-red-400 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.setCurrentPage}
        onItemsPerPageChange={pagination.setItemsPerPage}
        itemName="products"
      />
    </div>
  );
};

export default ProductList;
