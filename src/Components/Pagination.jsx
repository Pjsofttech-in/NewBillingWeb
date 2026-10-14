import {ChevronLeft, ChevronRight} from "lucide-react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 25,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [25, 50, 100, 200, 500],
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex justify-end pt-2 text-sm text-slate-600">
      {/* Bottom-right controls */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        {/* Page buttons navigation */}
        <div className="flex items-center gap-1">
          {/* Previous */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer rounded-md border border-slate-300 p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Page numbers */}
          {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              className={`cursor-pointer rounded-md border px-3 py-1 text-xs font-semibold transition-all ${
                currentPage === page
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="cursor-pointer rounded-md border border-slate-300 p-1.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            title="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Rows per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500"
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
    </div>
  );
};

export default Pagination;
