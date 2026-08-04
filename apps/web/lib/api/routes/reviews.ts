import { api } from "../client";

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const reviewsApi = {
  submit(
    productId: string,
    input: { rating: number; comment: string },
  ) {
    return unwrap<{ id: string; rating: number; comment: string }>(
      api.post(`/products/${productId}/reviews`, input),
    );
  },
};
