/**
 * Vendor pricing is based on the ACTUAL Product MRP (mirrors backend VendorPricingUtil).
 *  - mode "PERCENT": vendor gives a % discount     -> discount amount + purchase price are calculated
 *  - mode "FLAT"   : vendor gives a flat PRICE () -> that price IS the purchase price;
 *                    discount amount + discount % of MRP are calculated
 *  e.g. MRP 1000, vendor flat price 900 -> discount 100 = 10% of MRP, purchase price 900
 */
export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const resolveVendorPricing = ({productMrp, mode, value}) => {
  const mrp = Math.max(0, Number(productMrp) || 0);
  const input = Number(value);
  const hasValue =
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(input);

  if (mode === "FLAT") {
    if (!hasValue || input <= 0) {
      return {
        discountPct: 0,
        discountAmount: 0,
        purchasePrice: mrp,
        error: "Enter the vendor flat price in  (greater than 0).",
      };
    }
    if (mrp <= 0) {
      return {
        discountPct: 0,
        discountAmount: 0,
        purchasePrice: 0,
        error: "Enter Actual Product MRP first.",
      };
    }
    if (input > mrp) {
      return {
        discountPct: 0,
        discountAmount: 0,
        purchasePrice: input,
        error: "Vendor flat price cannot be more than Product MRP.",
      };
    }
    const discountAmount = mrp - input;
    return {
      discountPct: round2((discountAmount * 100) / mrp),
      discountAmount: round2(discountAmount),
      purchasePrice: round2(input),
      error: "",
    };
  }

  const pct = hasValue ? input : 0;
  if (pct < 0 || pct > 100) {
    return {
      discountPct: 0,
      discountAmount: 0,
      purchasePrice: mrp,
      error: "Vendor discount must be between 0 and 100.",
    };
  }
  const amount = (mrp * pct) / 100;
  return {
    discountPct: round2(pct),
    discountAmount: round2(amount),
    purchasePrice: round2(mrp - amount),
    error: "",
  };
};

/** Send only what the vendor gave; backend calculates the rest. */
export const vendorPricingFields = (mode, value) =>
  mode === "FLAT"
    ? {vendorFlatPrice: Number(value) || 0}
    : {vendorDiscountPercentage: Number(value) || 0};

/** The value to show in the input after switching mode (keeps the number meaningful). */
export const valueForMode = (mode, pricing) =>
  String(mode === "FLAT" ? pricing.purchasePrice : pricing.discountPct);

export const inr = (v) =>
  `${Number(v || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
