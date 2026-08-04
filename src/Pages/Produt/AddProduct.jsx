import {useQuery} from "@tanstack/react-query";
import {fetchAllProducts} from "../../api/productApi";
import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import {useState} from "react";

const AddProduct = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query to fetch products
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchAllProducts,
  });

  // Client-side filtering by name
  const filteredProducts = products.filter((p) =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className=" max-w-7xl mx-auto space-y-6">
      {/* Header section with counts, searchbar, and add button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          />
          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap">
            Total: {filteredProducts.length}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-md text-sm hover:bg-blue-700 transition"
        >
          + Add Product
        </button>
      </div>

      {/* Main product display section */}
      <div>
        {isLoading && (
          <div className="text-center py-10 text-gray-500">
            Loading products...
          </div>
        )}

        {isError && (
          <div className="text-center py-10 text-red-500">
            Error loading products: {error.message}
          </div>
        )}

        {!isLoading && !isError && <ProductList products={filteredProducts} />}
      </div>

      {/* Add Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default AddProduct;
