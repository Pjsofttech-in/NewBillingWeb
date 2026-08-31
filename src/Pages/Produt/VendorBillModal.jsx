import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ChevronDown, ChevronUp, CreditCard, FileText, Printer, RefreshCw, X} from "lucide-react";
import {
  addVendorBillPayment,
  fetchVendorBillPayments,
  fetchVendorBills,
  openVendorBillPdf,
} from "../../api/vendorServiceApi";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import {useForm} from "react-hook-form";

const PAYMENT_METHODS = [
  {value: "CASH", label: "Cash"},
  {value: "UPI", label: "UPI"},
  {value: "CREDIT_CARD", label: "Credit Card"},
  {value: "DEBIT_CARD", label: "Debit Card"},
  {value: "NET_BANKING", label: "Net Banking"},
];

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

const VendorPaymentForm = ({bill, onCancel, onSuccess}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm({
    defaultValues: {
      amountPaid: Number(bill?.dueAmount || 0).toFixed(2),
      paymentMethod: "CASH",
      transactionReference: "",
      notes: `Payment for ${bill?.billNumber || "vendor purchase bill"}`,
    },
  });

  const mutation = useMutation({
    mutationFn: addVendorBillPayment,
    onSuccess: () => {
      reset();
      onSuccess();
    },
  });

  const submit = async (data) => {
    await mutation.mutateAsync({
      billId: bill.id,
      paymentData: {
        amountPaid: Number(data.amountPaid),
        paymentMethod: data.paymentMethod || null,
        transactionReference: data.transactionReference?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-800">Record Vendor Payment</h4>
          <p className="text-xs text-slate-500">This payment is for bill {bill.billNumber}. Current due: {money(bill.dueAmount)}</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded p-1 text-slate-500 hover:bg-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(submit)} className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label="Amount Paying Now"
          name="amountPaid"
          type="number"
          register={register}
          rules={{
            required: "Payment amount is required",
            min: {value: 0.01, message: "Amount must be greater than 0"},
            max: {value: Number(bill.dueAmount || 0), message: `Amount cannot exceed due amount ${money(bill.dueAmount)}`},
          }}
          error={errors.amountPaid}
          required
        />
        <Select
          label="Payment Method"
          name="paymentMethod"
          register={register}
          options={PAYMENT_METHODS}
          error={errors.paymentMethod}
          required
          rules={{required: "Payment method is required"}}
        />
        <Input
          label="Transaction / Reference No."
          name="transactionReference"
          placeholder="UPI ID, bank reference, cheque no."
          register={register}
        />
        <Input
          label="Purpose / Notes"
          name="notes"
          placeholder="What are you paying for?"
          register={register}
          rules={{required: "Enter what this payment is for"}}
          error={errors.notes}
          required
        />
        {mutation.isError && (
          <p className="md:col-span-2 text-sm text-red-600">
            {mutation.error?.response?.data?.message || mutation.error?.message || "Unable to record payment."}
          </p>
        )}
        <div className="flex gap-2 md:col-span-2 md:justify-end">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button disabled={mutation.isPending} className="rounded-lg bg-[#0073b7] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {mutation.isPending ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
};

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
      <table className="w-full min-w-[720px] text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="p-2 text-left">Paid On</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-center">Method</th>
            <th className="p-2 text-left">Reference</th>
            <th className="p-2 text-left">What was paid for</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {history.map((payment) => (
            <tr key={payment.id}>
              <td className="p-2">{payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "-"}</td>
              <td className="p-2 text-right font-bold text-emerald-700">{money(payment.amountPaid)}</td>
              <td className="p-2 text-center">{payment.paymentMethod || "-"}</td>
              <td className="p-2">{payment.transactionReference || "-"}</td>
              <td className="p-2">{payment.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const VendorBillModal = ({isOpen, onClose}) => {
  const queryClient = useQueryClient();
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);

  const {data: bills = [], isLoading, isError, error, refetch} = useQuery({
    queryKey: ["vendorBills"],
    queryFn: fetchVendorBills,
    enabled: isOpen,
  });

  const activeBills = useMemo(() => [...bills].sort((a, b) => Number(b.id) - Number(a.id)), [bills]);

  if (!isOpen) return null;

  const errorMessage = error?.response?.data?.message || error?.message || "Unable to load vendor bills.";

  const handlePaymentSuccess = () => {
    const billId = paymentBill?.id;
    setPaymentBill(null);
    queryClient.invalidateQueries({queryKey: ["vendorBills"]});
    if (billId) queryClient.invalidateQueries({queryKey: ["vendorBillPayments", billId]});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-bold text-lg">Vendor Bills & Payments</h3>
            <p className="text-xs text-slate-500">See what stock was purchased, what has been paid, what each payment was for, and what is still due.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-auto p-4">
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
              {activeBills.map((bill) => {
                const isExpanded = expandedBillId === bill.id;
                const fullyPaid = bill.paymentStatus === "PAID" || Number(bill.dueAmount || 0) <= 0;
                const batch = bill.stockBatch;

                return (
                  <div key={bill.id} className="rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_auto] lg:items-center">
                      <div>
                        <p className="font-bold text-slate-800">{bill.billNumber}</p>
                        <p className="text-xs text-slate-500">Vendor: {bill.vendor?.vendorName || "N/A"}</p>
                        <p className="text-xs text-slate-500">Bill date: {bill.billDate || "-"}</p>
                      </div>
                      <div className="text-xs">
                        <p><span className="font-semibold">Purchase:</span> {bill.purchaseProductName || "Stock batch purchase"}</p>
                        <p>Batch: {bill.purchaseBatchNumber || batch?.batchNumber || "-"}</p>
                        <p>Qty: {bill.purchaseQuantity ?? batch?.initialQuantity ?? "-"} × {money(bill.purchaseUnitPrice ?? batch?.purchasePrice)}</p>
                      </div>
                      <div className="text-xs lg:text-right">
                        <p>Total: <b>{money(bill.totalAmount)}</b></p>
                        <p className="text-emerald-700">Paid: <b>{money(bill.paidAmount)}</b></p>
                        <p className="text-red-700">Due: <b>{money(bill.dueAmount)}</b></p>
                      </div>
                      <div className="text-xs lg:text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">{bill.paymentStatus || "UNPAID"}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {!fullyPaid && (
                          <button onClick={() => setPaymentBill(bill)} className="inline-flex items-center gap-1 rounded-lg bg-[#0073b7] px-3 py-2 text-xs font-semibold text-white">
                            <CreditCard className="h-3.5 w-3.5" /> Pay
                          </button>
                        )}
                        <button onClick={() => openVendorBillPdf(bill.id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                          <Printer className="h-3.5 w-3.5" /> Print
                        </button>
                        <button onClick={() => setExpandedBillId(isExpanded ? null : bill.id)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                          <FileText className="h-3.5 w-3.5" /> Details {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {paymentBill?.id === bill.id && (
                      <div className="border-t px-4 pb-4">
                        <VendorPaymentForm bill={bill} onCancel={() => setPaymentBill(null)} onSuccess={handlePaymentSuccess} />
                      </div>
                    )}

                    {isExpanded && (
                      <div className="border-t bg-slate-50/50 p-4">
                        <h4 className="mb-2 text-sm font-bold text-slate-800">Payment History</h4>
                        <PaymentHistory billId={bill.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t px-5 py-3">
          <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-sm text-blue-600"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          <button onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Close</button>
        </div>
      </div>
    </div>
  );
};

export default VendorBillModal;
