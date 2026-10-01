const currency = process.env.REACT_APP_CURRENCY || "DZD";
const locale = process.env.REACT_APP_LOCALE || "en-US";

export const storeConfig = {
  currency,
  locale,
  cashPaymentLabel: "Cash payment handled in person",
  deliveryLabel: "Delivery is coordinated separately",
};

export function formatPrice(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat(storeConfig.locale, {
    style: "currency",
    currency: storeConfig.currency,
  }).format(amount);
}
