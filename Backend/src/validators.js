const PACKAGE_PRICING = {
  essential: { price: 65, childPrice: 43 },
  signature: { price: 75, childPrice: 50 },
  premium: { price: 95, childPrice: 63 }
};

export function validateBookingPayload(payload = {}) {
  const errors = [];
  const data = payload;

  if (!data.serviceState) errors.push('serviceState is required');
  if (!data.city) errors.push('city is required');
  if (!data.eventDate) errors.push('eventDate is required');
  if (!data.eventTime) errors.push('eventTime is required');
  if (!data.contactName) errors.push('contactName is required');
  if (!data.contactEmail) errors.push('contactEmail is required');
  if (!data.contactPhone) errors.push('contactPhone is required');
  if (!data.agreeToTerms) errors.push('agreeToTerms must be true');

  const packageKey = data.package || 'signature';
  if (!PACKAGE_PRICING[packageKey]) errors.push('package is invalid');

  return errors;
}

export function calculateTotals(payload = {}) {
  const packageKey = payload.package || 'signature';
  const pricing = PACKAGE_PRICING[packageKey] || PACKAGE_PRICING.signature;
  const adults = Number(payload.numAdults || 0);
  const children = Number(payload.numChildren || 0);
  const base = adults * pricing.price + children * pricing.childPrice;
  const addonsTotal = Number(payload.addonsTotal || 0);
  const travelFeeAmount = payload.travelFeeStatus === 'included' ? 0 : Number(payload.travelFeeAmount || 0);
  const subtotal = base + addonsTotal;
  const total = payload.travelFeeStatus === 'tbd' ? subtotal : subtotal + travelFeeAmount;

  return { base, addonsTotal, subtotal, total };
}
