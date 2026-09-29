import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CheckCircle2, RefreshCw, X} from "lucide-react";
import {
  fetchVendorBillPayments,
  fetchVendorBills,
  markVendorBillPaymentDone,
} from "../../api/vendorServiceApi";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

const PaymentHistory = ({billId}) => {
  const {data: history = [], isLoading, isError, error} = useQuery({
    queryKey: ["vendorBillPayments", billId],
    queryFn: () => fetchVendorBillPayments(billId),
    enabled: Boolean(billId),
  });

  if (isLoading) return <p className="py-3 text-xs text-slate-500">Loading payment history...</p>;
  if (isError) return <p className="py-3 text-xs text-red-600">{error?.response?.data?.message || "Unable to load payment history."}</p>;
  if (!history.length) return <p className="py-3 text-xs text-slate-500">No payment recorded yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="p-2 text-left">Paid On</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-left">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((payment) => (
            <tr key={payment.id}>
              <td className="p-2">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "-"}</td>
              <td className="p-2 text-right font-bold text-emerald-700">{money(payment.amountPaid)}</td>
              <td className="p-2">{payment.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BillCard = ({bill, onMarkPaid, isMarking}) => {
  const fullyPaid = bill.paymentStatus === "PAID" || Number(bill.dueAmount || 0) <= 0;

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
        <div>
          <p className="font-bold text-slate-800">{bill.billNumber}</p>
          <p className="text-xs text-slate-500">Vendor: {bill.vendor?.vendorName || "N/A"}</p>
          <p className="text-xs text-slate-500">Bill date: {bill.billDate || "-"}</p>
        </div>

        <div className="text-xs lg:text-right">
          <p className="text-emerald-700">Amount Paid: <b>{money(bill.paidAmount)}</b></p>
          <p className="text-red-700">Pending Amount: <b>{money(bill.dueAmount)}</b></p>
          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
            {bill.paymentStatus || "UNPAID"}
          </span>
        </div>

        <div className="flex justify-start lg:justify-end">
          {fullyPaid ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Payment Complete
            </span>
          ) : (
            <button
              onClick={() => onMarkPaid(bill)}
              disabled={isMarking}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isMarking ? "Marking..." : "Mark Payment Done"}
            </button>
          )}
        </div>
      </div>

      <div className="border-t bg-slate-50/50 p-4">
        <h4 className="mb-2 text-sm font-bold text-slate-800">Payment History</h4>
        <PaymentHistory billId={bill.id} />
      </div>
    </div>
  );
};

const VendorBillModal = ({isOpen, onClose}) => {
  const queryClient = useQueryClient();
  const [markingBillId, setMarkingBillId] = useState(null);

  const {data: bills = [], isLoading, isError, error, refetch} = useQuery({
    queryKey: ["vendorBills"],
    queryFn: fetchVendorBills,
    enabled: isOpen,
  });

  const activeBills = useMemo(() => [...bills].sort((a, b) => Number(b.id) - Number(a.id)), [bills]);

  const markPaidMutation = useMutation({
    mutationFn: markVendorBillPaymentDone,
    onMutate: (billId) => setMarkingBillId(billId),
    onSuccess: (_data, billId) => {
      queryClient.invalidateQueries({queryKey: ["vendorBills"]});
      queryClient.invalidateQueries({queryKey: ["vendorBillPayments", billId]});
    },
    onSettled: () => setMarkingBillId(null),
  });

  if (!isOpen) return null;

  const errorMessage = error?.response?.data?.message || error?.message || "Unable to load vendor bills.";

  const handleMarkPaid = (bill) => {
    markPaidMutation.mutate(bill.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-bold text-lg">Vendor Bills & Payments</h3>
            <p className="text-xs text-slate-500">See how much is paid, how much is pending, and the full payment history for each bill.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-auto p-4">
          {markPaidMutation.isError && (
            <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600">
              {markPaidMutation.error?.response?.data?.message || markPaidMutation.error?.message || "Unable to mark payment as done."}
            </p>
          )}

          {isLoading ? (
            <p className="p-8 text-center">Loading vendor bills...</p>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="mb-2 font-semibold text-red-600">Failed to load vendor bills</p>
              <p className="mb-4 text-xs text-slate-500">{errorMessage}</p>
              <button onClick={() => refetch()} className="text-sm font-semibold text-blue-600">Retry</button>
            </div>
          ) : activeBills.length === 0 ? (
            <p className="p-8 text-center text-slate-500">No vendor bills found.</p>
          ) : (
            <div className="space-y-3">
              {activeBills.map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onMarkPaid={handleMarkPaid}
                  isMarking={markingBillId === bill.id && markPaidMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t px-5 py-3">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-sm text-blue-600"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Close</button>
        </div>
      </div>
    </div>
  );
};

export default VendorBillModal;
