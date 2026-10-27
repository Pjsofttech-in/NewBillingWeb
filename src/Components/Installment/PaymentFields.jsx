import {METHODS, inputCls, labelCls} from "./installmentHelpers";

// ------------------------------------------------------- payment method fields
// Cash: no bank account and no transaction id. Everything else shows both.
export default function PaymentFields({
  isOrder,
  accounts,
  method,
  setMethod,
  accountId,
  setAccountId,
  reference,
  setReference,
}) {
  const isCash = method === "CASH";
  return (
    <>
      <div>
        <label className={labelCls}>Payment method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={inputCls}
        >
          {METHODS.map((m) => (
            <option
              key={m}
              value={m}
            >
              {m.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      {!isCash && isOrder && (
        <div>
          <label className={labelCls}>Receiving account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={inputCls}
          >
            <option value="">No bank account</option>
            {accounts.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.accountName || a.bankName}
              </option>
            ))}
          </select>
        </div>
      )}
      {!isCash && (
        <div>
          <label className={labelCls}>Transaction ID</label>
          <input
            placeholder="Transaction / UTR / cheque no."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className={inputCls}
          />
        </div>
      )}
    </>
  );
}
