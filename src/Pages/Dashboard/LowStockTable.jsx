import {PackageSearch} from "lucide-react";

export default function LowStockTable({products, loading, threshold}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-red-50 p-1.5">
          <PackageSearch className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Low Stock Alerts</h2>
          <p className="text-[11px] text-slate-400">Products with stock below {threshold}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs text-slate-400">Loading stock alerts...</div>
      ) : products.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400">No low stock products.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left bg-blue-400 text-white">
                <th className="px-2.5 py-2">Product</th>
                <th className="px-2.5 py-2 text-right">Current stock</th>
                <th className="px-2.5 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-2.5 py-2 font-medium text-slate-700">{p.productName}</td>
                  <td className="px-2.5 py-2 text-right font-semibold text-red-600">{p.stock}</td>
                  <td className="px-2.5 py-2 text-right">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Low Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
