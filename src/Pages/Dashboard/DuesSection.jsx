import {Link} from "react-router-dom";
import {Clock, HandCoins, Landmark, ReceiptText} from "lucide-react";
import StatCard from "./StatCard";
import {money} from "./dashboardUtils";

// Money still to collect from customers / still to pay to vendors.
// Everything comes from GET /dashboard/summary (pendingOrders, customerInstallments, vendorInstallments).
export default function DuesSection({summary, loading}) {
  const pending = summary?.pendingOrders;
  const customer = summary?.customerInstallments;
  const vendor = summary?.vendorInstallments;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">Dues &amp; installments</h3>
        <Link to="/dues" className="text-xs font-semibold text-blue-600 hover:underline">
          View all dues →
        </Link>
      </div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        tone="amber"
        icon={HandCoins}
        label={`Pending from customers (${pending?.pendingOrdersCount ?? 0} orders)`}
        value={money(pending?.totalPendingAmount)}
        loading={loading}
      />
      <StatCard
        tone="rose"
        icon={Clock}
        label={`Overdue orders (${pending?.overdueOrdersCount ?? 0})`}
        value={money(pending?.overduePendingAmount)}
        loading={loading}
      />
      <StatCard
        tone="indigo"
        icon={ReceiptText}
        label={`Customer installments (${customer?.openInstallments ?? 0} open)`}
        value={`${money(customer?.totalPending)} · overdue ${money(customer?.overdueAmount)}`}
        loading={loading}
      />
      <StatCard
        tone="violet"
        icon={Landmark}
        label={`Vendor installments (${vendor?.openInstallments ?? 0} open)`}
        value={`${money(vendor?.totalPending)} · overdue ${money(vendor?.overdueAmount)}`}
        loading={loading}
      />
    </div>
    </div>
  );
}
