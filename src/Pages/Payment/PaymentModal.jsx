import {useMemo, useState} from "react";
import {X, CreditCard} from "lucide-react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createPayment} from "../../api/paymentService";
import {fetchPaymentReceivingAccounts} from "../../api/storeSettingsApi";
import {moneyPlain as money} from "../../utils/format";


export default function PaymentModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  showToast,
}) {
  const qc = useQueryClient();

  const due = useMemo(
    () =>
      Number(
        order?.pendingAmount ??
          Math.max(
            0,
            Number(order?.totalAmount || 0) - Number(order?.paidAmount || 0),
          ),
      ),
    [order],
  );

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [prevModalKey, setPrevModalKey] = useState(null);

  const currentModalKey = isOpen && order ? `${order.id}-${due}` : null;
  if (prevModalKey !== currentModalKey) {
    setPrevModalKey(currentModalKey);
    if (isOpen && order) {
      setAmount(due.toFixed(2));
      setMethod("UPI");
      setReceivingAccountId("");
      setReference("");
    }
  }

  const {data: accounts = []} = useQuery({
    queryKey: ["paymentReceivingAccounts"],
    queryFn: fetchPaymentReceivingAccounts,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (p) => createPayment(order.id, p),
    onSuccess: () => {
      qc.invalidateQueries({queryKey: ["orders"]});
      qc.invalidateQueries({queryKey: ["payments"]});
      qc.invalidateQueries({queryKey: ["orders-gst-summary"]});
      qc.invalidateQueries({queryKey: ["dashboard"]});
      showToast?.("Payment recorded successfully", "success");
      onSuccess?.();
      onClose();
    },
    onError: (e) =>
      showToast?.(
        e.response?.data?.message || "Failed to record payment",
        "error",
      ),
  });

  if (!isOpen || !order) return null;

  const submit = (e) => {
    e.preventDefault();
    const a = Number(amount);
    if (!a || a <= 0 || a > due + 0.009) {
      showToast?.(`Enter an amount between 0.01 and ${money(due)}`, "error");
      return;
    }
    mutation.mutate({
      amount: a,
      paymentMethod: method,
      receivingAccount:
        method === "CASH" || !receivingAccountId
          ? undefined
          : {id: Number(receivingAccountId)},
      transactionReference:
        method === "CASH" ? undefined : reference.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold">
              Record Payment — Order #{order.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-slate-500">Order total</p>
            <b>{money(order.totalAmount)}</b>
          </div>
          <div>
            <p className="text-slate-500">Pending amount</p>
            <b className="text-amber-700">{money(due)}</b>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">
              Amount ()
            </label>
            <input
              type="number"
              min="0.01"
              max={due}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-600">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2.5"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>
          </div>

          {method !== "CASH" && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-600">
                Receiving Store Account
              </label>
              <select
                value={receivingAccountId}
                onChange={(e) => setReceivingAccountId(e.target.value)}
                className="mt-1 w-full rounded-lg border p-2.5"
              >
                <option value="">No bank account selected</option>
                {accounts.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                  >
                    {a.accountName || a.bankName} — {a.accountType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {method !== "CASH" && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-600">
                Reference ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction / UTR / cheque no."
                className="mt-1 w-full rounded-lg border p-2.5"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-sm cursor-pointer hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || due <= 0}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? "Saving..." : "Submit Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
