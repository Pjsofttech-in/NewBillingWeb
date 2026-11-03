import Select from "../Form/Select";
import {METHOD_OPTIONS, fieldCls, fieldLabelCls} from "./installmentHelpers";

// ------------------------------------------------------- payment method fields
// Cash: no bank account and no transaction id. Everything else shows both.
//  inline  -> fixed-width fields with labels, to sit on one line with their neighbours (create form)
//  compact -> no labels, small fields, for inside a table row (pay an installment)
export default function PaymentFields({
  isOrder,
  accounts = [],
  method,
  setMethod,
  accountId,
  setAccountId,
  reference,
  setReference,
  inline = false,
  compact = false,
}) {
  const isCash = method === "CASH";
  const box = compact ? "w-32" : inline ? "w-full sm:w-40" : "";
  const selectCls = compact ? "py-1.5 sm:text-sm" : "";

  return (
    <>
      <div className={box}>
        <Select
          label={compact ? undefined : "Payment method"}
          id={compact ? undefined : undefined}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={METHOD_OPTIONS}
          showPlaceholder={false}
          className={selectCls}
        />
      </div>

      {!isCash && isOrder && (
        <div className={box}>
          <Select
            label={compact ? undefined : "Receiving account"}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            allowEmpty
            placeholder="No account"
            options={accounts.map((a) => ({
              value: String(a.id),
              label: a.accountName || a.bankName,
            }))}
            className={selectCls}
          />
        </div>
      )}

      {!isCash && (
        <div className={box}>
          {!compact && <label className={fieldLabelCls}>Transaction ID</label>}
          <input
            placeholder={compact ? "Txn ID" : "Transaction / UTR / cheque no."}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className={`${fieldCls} ${compact ? "py-1.5 sm:text-sm" : ""}`}
          />
        </div>
      )}
    </>
  );
}
