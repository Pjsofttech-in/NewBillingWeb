import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {X} from "lucide-react";
import {
  orderInstallmentApi,
  vendorBillInstallmentApi,
} from "../api/installmentApi";
import {fetchOrderById, updateOrder} from "../api/orderApi";
import {fetchPaymentReceivingAccounts} from "../api/storeSettingsApi";
import InstallmentReceiptModal from "./InstallmentReceiptModal";
import ConfirmModal from "./ConfirmModal";
import {money} from "../utils/format";
import {today, messageOf} from "./Installment/installmentHelpers";
import SummaryLine from "./Installment/SummaryLine";
import AddInstallmentPanel from "./Installment/AddInstallmentPanel";
import EqualPartsForm from "./Installment/EqualPartsForm";
import UpdateInstallmentsForm from "./Installment/UpdateInstallmentsForm";
import InstallmentRow from "./Installment/InstallmentRow";

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
  const [mode, setMode] = useState("CUSTOM"); // before the first installment: Custom installment | Equal parts
  const [showForm, setShowForm] = useState(false); // the Add installment form (hidden until its button is clicked)
  const [formDefaults, setFormDefaults] = useState({
    key: 0,
    amount: "",
    afterDate: null,
  });
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateFocus, setUpdateFocus] = useState(null); // installment whose invoice number was clicked
  // Invoice on screen: {installmentId}
  const [invoice, setInvoice] = useState(null);
  const [confirmRefund, setConfirmRefund] = useState(false); // Yes / No before the refund
  const [confirmRemove, setConfirmRemove] = useState(false); // Yes / No before removing the plan

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
        payload.numberOfInstallments
          ? "Installments created"
          : payload.initialPayment
            ? "Installment added and payment recorded"
            : "Installment added",
        "success",
      );
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not add the installment"), "error"),
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

  // "Refund" chosen on an installment that received money: the order is cancelled (stock goes back) and the
  // money received is marked REFUND. The backend keeps the plan and its payments as history.
  const refundMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      showToast?.("Order cancelled - status REFUND", "success");
      queryClient.invalidateQueries({queryKey: orderKey});
      queryClient.invalidateQueries({queryKey: ["products"]});
      queryClient.invalidateQueries({queryKey: ["customers"]});
      changed();
    },
    onError: (e) =>
      showToast?.(messageOf(e, "Could not mark the order as refund"), "error"),
  });

  // Status > Refund: ask Yes / No first (ConfirmModal), then cancel the order
  const requestRefund = () => {
    if (!order || refundMutation.isPending) return;
    setConfirmRefund(true);
  };

  const doRefund = () => {
    setConfirmRefund(false);
    refundMutation.mutate({
      id: referenceId,
      customerId: order.customer?.id,
      orderDate: order.orderDate,
      paymentDueDate: order.paymentDueDate || null,
      status: "CANCELLED",
    });
  };

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
    : summary
      ? {
          total: summary.total,
          paid: summary.paid,
          pending: summary.pending,
        }
      : plan
        ? {
            total: plan.planAmount,
            paid: plan.paidAmount,
            pending: plan.pendingAmount,
          }
        : null;

  const invoiceInstallment = invoice
    ? plan?.installments.find((i) => i.id === invoice.installmentId)
    : null;

  const waiting = isLoading || (isOrder && loadingOrder);
  const nothingPending = Number(totals?.pending ?? 0) <= 0.009;

  // A cancelled order only keeps its plan as history: no more payments or changes
  const cancelled = isOrder && order?.status === "CANCELLED";
  const refundAmount = Number(order?.refundAmount ?? 0);

  // Scheduled = what is still to be paid through installments. Left to allocate = unpaid amount that is
  // not in any installment yet (the next "Add installment" can use it).
  const pendingNow = totals ? Number(totals.pending) : null;
  const scheduled = plan ? Number(plan.pendingAmount) : 0;
  const unallocated =
    pendingNow === null ? null : Math.max(0, pendingNow - scheduled);
  const allInstallmentsCreated = unallocated !== null && unallocated <= 0.009;
  const customActive = Boolean(plan) || mode === "CUSTOM";

  // Installments without any payment can be edited; the others are locked
  const editableInstallments = (plan?.installments || []).filter(
    (i) => Number(i.paidAmount) <= 0,
  );
  const lockedPending = (plan?.installments || [])
    .filter((i) => Number(i.paidAmount) > 0)
    .reduce((s, i) => s + Number(i.pendingAmount || 0), 0);
  const updateTarget = totals ? Number(totals.pending) - lockedPending : 0;
  // Click on an invoice number -> the update table opens (paid installments cannot be changed)
  const openUpdate = (inst) => {
    if (Number(inst.paidAmount) > 0) {
      showToast?.("A paid installment cannot be changed", "error");
      return;
    }
    setShowForm(false);
    setUpdateFocus(inst.id);
    setShowUpdate(true);
  };

  // "Add" in the form saves the installment right away: the first one creates the plan, the next ones are
  // added to it. Paid = paid now (the first one goes with the plan, later ones are paid right after adding).
  const handleAdd = async ({
    dueAmount,
    dueDate,
    paidDate,
    remark,
    paid,
    payment,
  }) => {
    const isCash = payment.method === "CASH";
    const paymentPayload = {
      amount: dueAmount,
      paymentDate: paid && paidDate ? paidDate : today(),
      paymentMethod: payment.method,
      receivingAccountId:
        isOrder && !isCash && payment.accountId
          ? Number(payment.accountId)
          : undefined,
      transactionReference:
        !isCash && payment.reference ? payment.reference : undefined,
    };
    const row = {dueAmount, dueDate, remark: remark || undefined};

    if (!plan) {
      await createMutation.mutateAsync({
        installments: [row],
        scheduleRestLater: true,
        ...(paid ? {initialPayment: paymentPayload} : {}),
      });
    } else {
      const updated = await addMutation.mutateAsync(row);
      if (paid) {
        const created = updated.installments.reduce((a, b) =>
          b.installmentNumber > a.installmentNumber ? b : a,
        );
        try {
          await payMutation.mutateAsync({
            installmentId: created.id,
            ...paymentPayload,
          });
        } catch {
          /* the installment exists; the payment error is already shown, pay it from the table */
        }
      }
    }

    // Something still left to schedule: keep the form open for the next one
    const left = unallocated === null ? 0 : unallocated - dueAmount;
    if (left > 0.009) {
      setFormDefaults({
        key: Date.now(),
        amount: left.toFixed(2),
        afterDate: dueDate,
      });
    } else {
      setShowForm(false);
    }
  };

  const th =
    "border border-blue-300 bg-blue-400 px-3 py-2.5 text-sm font-bold text-white";
  const columns = isOrder ? 8 : 7;
  const tabBtn = (active) =>
    `cursor-pointer rounded-md px-4 py-2 text-xs font-bold uppercase ${
      active
        ? "bg-blue-700 text-white"
        : "border border-blue-600 bg-white text-blue-700 hover:bg-blue-50"
    }`;

  const addButton =
    customActive && !cancelled ? (
      <button
        type="button"
        disabled={
          showForm || showUpdate || nothingPending || allInstallmentsCreated
        }
        title={
          allInstallmentsCreated
            ? "The whole amount is already in installments"
            : undefined
        }
        onClick={() => {
          setFormDefaults({
            key: Date.now(),
            amount:
              unallocated && unallocated > 0.009 ? unallocated.toFixed(2) : "",
            afterDate: null,
          });
          setShowForm(true);
        }}
        className="cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      >
        Add installment
      </button>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92dvh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-xl">
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
          ) : (
            <>
              {/* Total / Paid / Pending / Scheduled / Left to allocate and the Add installment button on ONE line */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                {totals ? (
                  <SummaryLine
                    total={totals.total}
                    paid={totals.paid}
                    pending={totals.pending}
                    scheduled={scheduled}
                    left={unallocated ?? undefined}
                    overdue={plan?.overdueAmount}
                  />
                ) : (
                  <span />
                )}

                {plan && addButton}
              </div>

              {/* Before the first installment: one at a time (custom) or all at once (equal parts) */}
              {!plan && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("CUSTOM")}
                    className={tabBtn(mode === "CUSTOM")}
                  >
                    Custom installment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("AUTO");
                      setShowForm(false);
                    }}
                    className={tabBtn(mode === "AUTO")}
                  >
                    Equal parts
                  </button>
                  {/* Add installment sits to the right of "Equal parts" */}
                  {mode === "CUSTOM" && addButton}
                </div>
              )}

              {cancelled && (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  This order is cancelled.{" "}
                  {refundAmount > 0.009 ? (
                    <>
                      Status <b>REFUND</b>: {money(refundAmount)} received from
                      the customer is to be returned.
                    </>
                  ) : (
                    "Nothing was received, so there is nothing to refund."
                  )}
                </p>
              )}

              {!plan && mode === "AUTO" ? (
                <EqualPartsForm
                  orderId={referenceId}
                  isOrder={isOrder}
                  pending={pendingNow}
                  isPending={createMutation.isPending}
                  onSubmit={(payload) => createMutation.mutate(payload)}
                />
              ) : (
                <>
                  {showForm && !cancelled && (
                    <AddInstallmentPanel
                      key={formDefaults.key}
                      isOrder={isOrder}
                      accounts={accounts}
                      unallocated={unallocated}
                      defaultAmount={formDefaults.amount}
                      afterDate={formDefaults.afterDate}
                      busy={
                        createMutation.isPending ||
                        addMutation.isPending ||
                        payMutation.isPending
                      }
                      onAdd={handleAdd}
                      onCancel={() => setShowForm(false)}
                    />
                  )}

                  {showUpdate && plan && (
                    <UpdateInstallmentsForm
                      key={updateFocus}
                      orderId={referenceId}
                      focusId={updateFocus}
                      installments={editableInstallments}
                      target={updateTarget}
                      isPending={updateMutation.isPending}
                      onCancel={() => setShowUpdate(false)}
                      onSubmit={(rows) => updateMutation.mutate(rows)}
                    />
                  )}

                  {/* The table is always there: empty until the first installment is added */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className={th}>
                            {isOrder ? "Invoice No" : "No"}
                          </th>
                          <th className={th}>Amount</th>
                          <th className={th}>Due Date</th>
                          <th className={th}>Paid Date</th>
                          <th className={th}>Remark</th>
                          <th className={th}>Status</th>
                          <th className={th}>Payment Method</th>
                          {isOrder && <th className={th}>Invoice</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {!plan ? (
                          <tr>
                            <td
                              colSpan={columns}
                              className="px-3 py-6 text-center text-sm text-slate-400"
                            >
                              No installments yet. Click &quot;Add
                              installment&quot; to add the first one.
                            </td>
                          </tr>
                        ) : (
                          plan.installments.map((inst, index) => (
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
                              onPrint={() =>
                                setInvoice({installmentId: inst.id})
                              }
                              locked={cancelled}
                              onRefund={
                                isOrder && !cancelled
                                  ? requestRefund
                                  : undefined
                              }
                              isRefunding={refundMutation.isPending}
                              onOpenUpdate={
                                isOrder && !cancelled ? openUpdate : undefined
                              }
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {plan && (
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
                      setConfirmRemove(true);
                    }}
                    className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove plan
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmRefund}
        title="Mark this order as REFUND?"
        tone="warning"
        isLoading={refundMutation.isPending}
        message={`The order will be cancelled, the stock goes back, and ${money(order?.paidAmount || 0)} received from the customer is to be returned.`}
        confirmText="Yes"
        cancelText="No"
        onConfirm={doRefund}
        onCancel={() => setConfirmRefund(false)}
      />
      <ConfirmModal
        isOpen={confirmRemove}
        title="Remove this installment plan?"
        isLoading={deleteMutation.isPending}
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {
          setConfirmRemove(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setConfirmRemove(false)}
      />

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
