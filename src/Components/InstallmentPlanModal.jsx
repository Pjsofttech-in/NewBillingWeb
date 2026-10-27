import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {X} from "lucide-react";
import {
  orderInstallmentApi,
  vendorBillInstallmentApi,
} from "../api/installmentApi";
import {fetchOrderById} from "../api/orderApi";
import {fetchPaymentReceivingAccounts} from "../api/storeSettingsApi";
import InstallmentReceiptModal from "./InstallmentReceiptModal";
import {money} from "../utils/format";
import {today, messageOf} from "./Installment/installmentHelpers";
import SummaryLine from "./Installment/SummaryLine";
import CreatePlanForm from "./Installment/CreatePlanForm";
import InstallmentEntryForm from "./Installment/InstallmentEntryForm";
import UpdateInstallmentsForm from "./Installment/UpdateInstallmentsForm";
import InstallmentRow from "./Installment/InstallmentRow";

// ------------------------------------------------------------ add installment
// For the part of the order amount that is not in the plan yet.
function AddInstallmentForm({unallocated, onSubmit, onCancel, isPending}) {
  return (
    <InstallmentEntryForm
      defaultAmount={Number(unallocated).toFixed(2)}
      maxAmount={Number(unallocated)}
      minDate={today()}
      hint={`${money(unallocated)} of the order is not in any installment yet.`}
      busy={isPending}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

// ------------------------------------------------------------------- modal
/**
 * kind = "order"  -> customer pays the store, in installments
 * kind = "vendor" -> the store pays a vendor bill, in installments
 */
export default function InstallmentPlanModal({
  kind,
  referenceId,
  title,
  onClose,
  onChanged,
  showToast,
  summary, // vendor bills: {total, paid, pending} of the bill, shown before a plan exists
}) {
  const isOrder = kind === "order";
  const api = isOrder ? orderInstallmentApi : vendorBillInstallmentApi;
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  // Invoice on screen: {installmentId}
  const [invoice, setInvoice] = useState(null);

  const planKey = ["installmentPlan", kind, referenceId];
  const orderKey = ["orders", "detail", referenceId];

  const {data: plan, isLoading} = useQuery({
    queryKey: planKey,
    queryFn: () => api.fetchPlan(referenceId),
    retry: false, // the backend answers with an error while no plan exists
  });

  // Order totals (total / paid / pending) - also the base of the invoices
  const {data: order, isLoading: loadingOrder} = useQuery({
    queryKey: orderKey,
    queryFn: () => fetchOrderById(referenceId),
    enabled: isOrder,
    retry: 1,
  });

  const {data: accounts = []} = useQuery({
    queryKey: ["paymentReceivingAccounts"],
    queryFn: fetchPaymentReceivingAccounts,
    enabled: isOrder,
  });

  const changed = () => {
    queryClient.invalidateQueries({queryKey: planKey});
    queryClient.invalidateQueries({queryKey: ["dashboard"]});
    queryClient.invalidateQueries({queryKey: ["installmentDues"]});
    queryClient.invalidateQueries({
      queryKey: isOrder ? ["orders"] : ["vendorBills"],
    });
    onChanged?.();
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.createPlan({id: referenceId, ...payload}),
    onSuccess: (newPlan, payload) => {
      queryClient.setQueryData(planKey, newPlan);
      showToast?.(
        payload.initialPayment
          ? "Installment plan created and first payment recorded"
          : "Installment plan created",
        "success",
      );
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not create the plan"), "error"),
  });

  const payMutation = useMutation({
    mutationFn: api.payInstallment,
    onSuccess: (newPlan) => {
      queryClient.setQueryData(planKey, newPlan);
      showToast?.("Installment payment recorded", "success");
      changed();
    },
    onError: (e) => showToast?.(messageOf(e, "Payment failed"), "error"),
  });

  const addMutation = useMutation({
    mutationFn: (payload) => api.addInstallment({id: referenceId, ...payload}),
    onSuccess: (newPlan) => {
      queryClient.setQueryData(planKey, newPlan);
      showToast?.("Installment added", "success");
      setShowAdd(false);
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not add the installment"), "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (rows) => api.updateInstallments({id: referenceId, rows}),
    onSuccess: (newPlan) => {
      queryClient.setQueryData(planKey, newPlan);
      showToast?.("Installments updated", "success");
      setShowUpdate(false);
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not update the installments"), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePlan(referenceId),
    onSuccess: () => {
      showToast?.("Installment plan removed", "success");
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not remove the plan"), "error"),
  });

  const hasPayments = plan?.paidAmount > 0;

  // Total / paid / pending of the whole order (orders) or of the plan (vendor bills)
  const totals = isOrder
    ? order
      ? {
          total: order.totalAmount,
          paid: order.paidAmount,
          pending:
            order.pendingAmount ??
            Math.max(
              0,
              Number(order.totalAmount || 0) - Number(order.paidAmount || 0),
            ),
        }
      : null
    : plan
      ? {
          total: plan.planAmount,
          paid: plan.paidAmount,
          pending: plan.pendingAmount,
        }
      : summary
        ? {
            total: summary.total,
            paid: summary.paid,
            pending: summary.pending,
          }
        : null;

  const invoiceInstallment = invoice
    ? plan?.installments.find((i) => i.id === invoice.installmentId)
    : null;

  const waiting = isLoading || (isOrder && loadingOrder);
  const nothingPending = Number(totals?.pending ?? 0) <= 0.009;

  // Part of the unpaid order amount that is not in any installment (normally 0 right after the plan is created)
  const unallocated =
    isOrder && plan && totals
      ? Math.max(0, Number(totals.pending) - Number(plan.pendingAmount))
      : 0;
  const allInstallmentsCreated = unallocated <= 0.009;

  // Installments without any payment can be edited; the others are locked
  const editableInstallments = (plan?.installments || []).filter(
    (i) => Number(i.paidAmount) <= 0,
  );
  const lockedPending = (plan?.installments || [])
    .filter((i) => Number(i.paidAmount) > 0)
    .reduce((s, i) => s + Number(i.pendingAmount || 0), 0);
  const updateTarget = totals ? Number(totals.pending) - lockedPending : 0;
  const th =
    "border border-blue-300 bg-blue-400 px-3 py-2.5 text-sm font-bold text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-slate-800">
            Installment Details
            <span className="ml-2 text-sm font-normal text-slate-500">
              {title}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {waiting ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : !plan ? (
            <>
              {totals && (
                <SummaryLine
                  total={totals.total}
                  paid={totals.paid}
                  pending={totals.pending}
                />
              )}

              <CreatePlanForm
                orderId={referenceId}
                isOrder={isOrder}
                pending={totals ? Number(totals.pending) : null}
                accounts={accounts}
                onSubmit={(payload) => createMutation.mutate(payload)}
                isPending={createMutation.isPending}
              />
            </>
          ) : (
            <>
              <SummaryLine
                total={totals?.total ?? plan.planAmount}
                paid={totals?.paid ?? plan.paidAmount}
                pending={totals?.pending ?? plan.pendingAmount}
                overdue={plan.overdueAmount}
              />

              {/* <p className="text-xs text-slate-500">
                Plan: {money(plan.planAmount)} · {plan.paidInstallments} of{" "}
                {plan.totalInstallments} installments paid
                {plan.nextDueDate ? ` · next due ${plan.nextDueDate}` : ""}
                {isOrder && allInstallmentsCreated && !nothingPending
                  ? " · the whole pending amount is in installments"
                  : ""}
              </p> */}

              {isOrder && (
                <div className="flex flex-wrap gap-2">
                  {/* Disabled once the whole amount is in installments */}
                  <button
                    type="button"
                    disabled={
                      nothingPending ||
                      allInstallmentsCreated ||
                      showAdd ||
                      showUpdate
                    }
                    title={
                      allInstallmentsCreated
                        ? "The whole amount is already in installments"
                        : undefined
                    }
                    onClick={() => setShowAdd(true)}
                    className="cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    Add installment
                  </button>
                  <button
                    type="button"
                    disabled={
                      nothingPending ||
                      editableInstallments.length === 0 ||
                      showAdd ||
                      showUpdate
                    }
                    onClick={() => setShowUpdate(true)}
                    className="cursor-pointer rounded-md border border-blue-700 bg-white px-4 py-2 text-xs font-bold uppercase text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
                  >
                    Update installment
                  </button>
                </div>
              )}

              {showAdd && (
                <AddInstallmentForm
                  unallocated={unallocated}
                  isPending={addMutation.isPending}
                  onCancel={() => setShowAdd(false)}
                  onSubmit={(payload) => addMutation.mutate(payload)}
                />
              )}

              {showUpdate && (
                <UpdateInstallmentsForm
                  orderId={referenceId}
                  installments={editableInstallments}
                  target={updateTarget}
                  isPending={updateMutation.isPending}
                  onCancel={() => setShowUpdate(false)}
                  onSubmit={(rows) => updateMutation.mutate(rows)}
                />
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={th}>{isOrder ? "Invoice No" : "No"}</th>
                      <th className={th}>Amount</th>
                      <th className={th}>Due Date</th>
                      <th className={th}>Installment Date</th>
                      <th className={th}>Status / Action</th>
                      {isOrder && <th className={th}>Invoice</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.installments.map((inst, index) => (
                      <InstallmentRow
                        key={inst.id}
                        inst={inst}
                        index={index}
                        orderId={referenceId}
                        isOrder={isOrder}
                        accounts={accounts}
                        isSaving={
                          payMutation.isPending &&
                          payMutation.variables?.installmentId === inst.id
                        }
                        onSave={(payload) => payMutation.mutate(payload)}
                        onPrint={() => setInvoice({installmentId: inst.id})}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={hasPayments || deleteMutation.isPending}
                  title={
                    hasPayments
                      ? "A plan with payments cannot be removed"
                      : undefined
                  }
                  onClick={() => {
                    if (window.confirm("Remove this installment plan?"))
                      deleteMutation.mutate();
                  }}
                  className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove plan
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {invoice && plan && invoiceInstallment && (
        <InstallmentReceiptModal
          plan={plan}
          order={order}
          installment={invoiceInstallment}
          payments={invoiceInstallment.payments || []}
          onClose={() => setInvoice(null)}
        />
      )}
    </div>
  );
}
