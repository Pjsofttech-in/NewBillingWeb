import {useState, useMemo} from "react";
import {Plus, Edit2, Trash2, Search, XCircle} from "lucide-react";

const CustomerList = ({
  customers = [],
  isLoading = false,
  onOpenCreate,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter customers dynamically based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase().trim();

    return customers.filter((cust) => {
      const name = cust.customerName?.toLowerCase() || "";
      const email = cust.email?.toLowerCase() || "";
      const phone = cust.phone?.toLowerCase() || "";
      const city = cust.city?.toLowerCase() || "";
      const state = cust.state?.toLowerCase() || "";
      const landmark = cust.landmark?.toLowerCase() || "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        city.includes(query) ||
        state.includes(query) ||
        landmark.includes(query)
      );
    });
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Layout: Search Bar (Left) + Counter Badge & Add Button (Right) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Customer Name, Email, City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-500 border-slate-300 bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Clear search"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Buttons & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 whitespace-nowrap">
            Total Customers : {customers.length}
          </span>

          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            ADD CUSTOMER
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-xs">
            <tr>
              <th className="px-4 py-3.5">ID</th>
              <th className="px-4 py-3.5">Customer name</th>
              <th className="px-4 py-3.5">Contact details</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-500"
                >
                  Loading customer records...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-500"
                >
                  No customers found. Click <strong>ADD CUSTOMER</strong> to add
                  one.
                </td>
              </tr>
            ) : filteredCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-500"
                >
                  No customers matching &quot;
                  <strong className="text-slate-700">{searchQuery}</strong>
                  &quot;.
                </td>
              </tr>
            ) : (
              filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    #{cust.id}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {cust.customerName}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span className="text-slate-800 font-medium">
                        {cust.phone}
                      </span>
                      <span className="text-slate-500">{cust.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col text-xs">
                      <span>
                        {cust.city}, {cust.state}
                      </span>
                      {cust.landmark && (
                        <span className="text-slate-400 text-[11px]">
                          Near: {cust.landmark}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => onEdit(cust)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(cust.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;
