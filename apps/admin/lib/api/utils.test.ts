import { describe, it, expect } from "vitest";
import type { AxiosResponse } from "axios";
import { unwrap, toQueryString } from "./utils";

function fakeResponse<T>(data: T): AxiosResponse<{ success: true; data: T }> {
  return {
    data: { success: true, data },
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as AxiosResponse["config"],
  };
}

describe("unwrap", () => {
  it("returns the inner data from a { success, data } envelope", () => {
    const res = fakeResponse({ id: "abc", name: "Test" });
    expect(unwrap(res)).toEqual({ id: "abc", name: "Test" });
  });

  it("works with primitive data", () => {
    const res = fakeResponse("hello");
    expect(unwrap(res)).toBe("hello");
  });
});

describe("toQueryString", () => {
  it("returns an empty string when there are no usable params", () => {
    expect(toQueryString({})).toBe("");
    expect(toQueryString({ a: undefined, b: null, c: "" })).toBe("");
  });

  it("builds a query string from provided params", () => {
    const qs = toQueryString({ search: "shoes", page: 2 });
    expect(qs.startsWith("?")).toBe(true);
    const params = new URLSearchParams(qs.slice(1));
    expect(params.get("search")).toBe("shoes");
    expect(params.get("page")).toBe("2");
  });

  it("skips undefined, null, and empty-string values but keeps falsy-but-valid ones", () => {
    const qs = toQueryString({
      search: "shoes",
      category: undefined,
      city: null,
      inStockOnly: "",
      minPrice: 0,
      active: false,
    });
    const params = new URLSearchParams(qs.slice(1));

    expect(params.has("category")).toBe(false);
    expect(params.has("city")).toBe(false);
    expect(params.has("inStockOnly")).toBe(false);

    expect(params.get("minPrice")).toBe("0");
    expect(params.get("active")).toBe("false");
  });
});
