import {useState, useEffect} from "react";
import {X, CreditCard} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createPayment} from "../../api/paymentService";

const PaymentModal = ({order, isOpen, onClose, onSuccess, showToast}) => {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentStatus, setPaymentStatus] = useState("SUCCESS");

  useEffect(() => {
    if (order && isOpen) {
      setAmount(order.totalAmount || "");
      setPaymentMethod("UPI");
      setPaymentStatus("SUCCESS");
    }
  }, [order, isOpen]);

  // 🔥 React Query Mutation for Creating Payment
  const paymentMutation = useMutation({
    mutationFn: (payload) => createPayment(order.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["payments"]});

      showToast("Payment recorded & status updated to Completed!", "success");

      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Payment failed", error);
      showToast(
        error.response?.data?.message || "Failed to record payment",
        "error",
      );
    },
  });

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      amount: parseFloat(amount),
      paymentMethod,
      paymentStatus, // 'SUCCESS' पाठवल्यास backend वर Order Status 'COMPLETED' होईल
      orderStatus: paymentStatus === "SUCCESS" ? "COMPLETED" : "PENDING",
    };

    paymentMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              Record Payment (Order #{order.id})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="CASH">CASH</option>
              <option value="UPI">UPI</option>
              <option value="CREDIT_CARD">CREDIT CARD</option>
              <option value="DEBIT_CARD">DEBIT CARD</option>
              <option value="NET_BANKING">NET BANKING</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="SUCCESS">SUCCESS</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paymentMutation.isPending}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {paymentMutation.isPending ? "Processing..." : "Submit Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
