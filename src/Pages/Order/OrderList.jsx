import {Package, Plus} from "lucide-react";

const OrderList = ({orders = [], isLoading, onOpenCreate, onDelete}) => {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Top Header */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Order Management
            </h1>
            
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-2 bg-[#0073b7] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#0867a0] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading Orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm">
                No orders found. Click above to create one.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="p-4 font-bold text-slate-700">
                        #{order.id}
                      </td>
                      <td className="p-4">
                        {order.customer?.customerName || "N/A"}
                      </td>
                      <td className="p-4">{order.orderDate}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        ₹
                        {order.totalAmount
                          ? order.totalAmount.toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => onDelete(order.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
