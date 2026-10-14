import {inr} from "../../utils/vendorPricing";

/**
 * Two grid cells: [pricing type + input] and [the auto-calculated value].
 *  - "%"          : vendor gives a discount % on MRP  -> shows the discount amount
 *  - "Flat Price" : vendor gives a flat price (= purchase price)
 *                   -> shows the discount % of MRP and the discount amount
 */
const VendorDiscountFields = ({mode, value, onModeChange, onValueChange, resolved}) => {
  const isFlat = mode === "FLAT";
  return (
    <>
      <div className="flex flex-col">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            {isFlat ? "Vendor Flat Price (₹)" : "Vendor Disc %"}
          </label>
          <div className="flex overflow-hidden rounded border border-slate-300 text-[10px] font-bold">
            {[["PERCENT", "%"], ["FLAT", "Flat ₹"]].map(([m, label]) => (
              <button
                key={m}
                type="button"
                title={m === "FLAT" ? "Vendor gives a flat price (purchase price)" : "Vendor gives a discount %"}
                onClick={() => onModeChange(m)}
                className={`px-1.5 py-0.5 ${mode === m ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          min="0"
          max={isFlat ? undefined : "100"}
          step="0.01"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          {isFlat ? "Disc % of MRP" : "Discount Amount"}
        </label>
        <div className="flex h-8 w-full items-center rounded border border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-700">
          {isFlat
            ? `${resolved.discountPct}%  (${inr(resolved.discountAmount)} off)`
            : inr(resolved.discountAmount)}
        </div>
      </div>
    </>
  );
};

export default VendorDiscountFields;
