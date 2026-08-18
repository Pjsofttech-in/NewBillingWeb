import {ChevronLeft, ChevronRight} from "lucide-react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  endIndex = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  itemName = "entries",
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2 text-sm text-slate-600">
      {/* Items count summary & selector */}
      <div className="flex flex-wrap items-center gap-4">
        <span>
          Showing{" "}
          <span className="font-semibold text-slate-800">{startIndex + 1}</span>{" "}
          to <span className="font-semibold text-slate-800">{endIndex}</span> of{" "}
          <span className="font-semibold text-slate-800">{totalItems}</span>{" "}
          {itemName}
        </span>

        {/* Rows per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border border-slate-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option
                  key={size}
                  value={size}
                >
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page buttons navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-xs font-semibold rounded-md border cursor-pointer transition-all ${
              currentPage === page
                ? "bg-[#0073b7] text-white border-[#0073b7]"
                : "border-slate-300 hover:bg-slate-100 text-slate-700"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
