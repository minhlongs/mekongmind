import { POLAR_PRODUCTS, type ProductId } from './polar-config';

type CheckoutInput = {
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
};

export async function createCheckoutSession(
  productId: ProductId,
  input: CheckoutInput = {}
) {
  const product = POLAR_PRODUCTS[productId];
  const params = new URLSearchParams({
    product: product.id,
  });

  if (input.email) params.set('email', input.email);
  if (input.successUrl) params.set('success', input.successUrl);
  if (input.cancelUrl) params.set('cancel', input.cancelUrl);
  if (input.metadata) {
    for (const [k, v] of Object.entries(input.metadata)) {
      params.set(k, v);
    }
  }

  return {
    checkoutUrl: `https://polar.sh/checkout?${params.toString()}`,
    productId,
    product,
  };
}
