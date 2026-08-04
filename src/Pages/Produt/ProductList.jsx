import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProduct } from "../../api/productApi";

const ProductList = ({ products = [] }) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      alert("Failed to delete product: " + error.message);
    },
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-xs">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Product Info</th>
            <th className="px-4 py-3">Pricing & Discount</th>
            <th className="px-4 py-3">GST Details</th>
            <th className="px-4 py-3">Stock & Unit</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Total Value</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((item) => {
            // Dynamic Discount Calculation
            const mrp = item.mrp || 0;
            const price = item.price || 0;
            const discountAmount = mrp > price ? mrp - price : 0;
            const discountPercentage =
              mrp > 0 && mrp > price
                ? Math.round((discountAmount / mrp) * 100)
                : 0;

            return (
              <tr key={item.id} className="hover:bg-gray-50">
                {/* ID */}
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                  #{item.id}
                </td>

                {/* Product Name, Type & Brand */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-800">
                    {item.productName}
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    {item.brand?.brandName && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 rounded border border-blue-200">
                        {item.brand.brandName}
                      </span>
                    )}
                    {item.productType?.typeName && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded border border-gray-200">
                        {item.productType.typeName}
                      </span>
                    )}
                  </div>
                </td>

                {/* Price, MRP & Discount % */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      ₹{price.toLocaleString()}
                    </span>
                    {mrp > price && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹{mrp.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-xs text-green-600 font-medium mt-0.5">
                      {discountPercentage}% Off (Save ₹{discountAmount.toLocaleString()})
                    </div>
                  )}
                </td>

                {/* GST Details */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {item.gstApplicable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                      {item.gstPercentage}% GST
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">No GST</span>
                  )}
                </td>

                {/* Stock, Availability & Unit */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {item.stock ?? 0} {item.unitType?.unitType || ""}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${
                        item.available
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.available ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </td>

                {/* Vendor Details */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-700">
                    {item.vendor?.vendorName || "N/A"}
                  </div>
                  {item.vendor?.city && (
                    <div className="text-xs text-gray-400">
                      {item.vendor.city}
                    </div>
                  )}
                </td>

                {/* Total Value (Stock * Price) */}
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  ₹{(item.totalAmount ?? price * (item.stock || 0)).toLocaleString()}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;