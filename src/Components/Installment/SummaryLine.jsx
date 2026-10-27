import {money} from "../../utils/format";

// ------------------------------------------------------------------ summary
// "Total: 35400   Paid: 35400   Pending: 0" - shown above both "Equal parts" and
// "Custom amounts" and above the created plan.
export default function SummaryLine({total, paid, pending, overdue}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">
      <span>
        Total: <b>{money(total)}</b>
      </span>
      <span>
        Paid: <b className="text-green-700">{money(paid)}</b>
      </span>
      <span>
        Pending: <b className="text-red-600">{money(pending)}</b>
      </span>
      {Number(overdue) > 0 && (
        <span>
          Overdue: <b className="text-red-700">{money(overdue)}</b>
        </span>
      )}
    </div>
  );
}
