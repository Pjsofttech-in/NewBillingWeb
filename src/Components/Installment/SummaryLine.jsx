import {money} from "../../utils/format";

// ------------------------------------------------------------------ summary
// "Total: 35400   Paid: 35400   Pending: 0" - and, while a custom plan is being built,
// "Scheduled" and "Left to allocate" (live, they change with every installment added).
export default function SummaryLine({
  total,
  paid,
  pending,
  overdue,
  scheduled,
  left,
}) {
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
      {scheduled !== undefined && (
        <span>
          Scheduled: <b>{money(scheduled)}</b>
        </span>
      )}
      {left !== undefined && (
        <span>
          Left to allocate:{" "}
          <b className={Math.abs(left) < 0.005 ? "text-green-700" : "text-red-600"}>
            {money(left)}
          </b>
        </span>
      )}
      {Number(overdue) > 0 && (
        <span>
          Overdue: <b className="text-red-700">{money(overdue)}</b>
        </span>
      )}
    </div>
  );
}
