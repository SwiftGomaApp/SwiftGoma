import { api } from "../client";

function unwrap<T>(promise: Promise<{ data: { data: T } }>) {
  return promise.then((res) => res.data.data);
}

export const supportApi = {
  contact(input: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return unwrap<{ id: string; received: boolean }>(
      api.post("/support/contact", input),
    );
  },
};
