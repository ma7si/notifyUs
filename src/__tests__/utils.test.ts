import { calcCTR, truncate, isArabicText } from "@/lib/utils";

describe("calcCTR", () => {
  test("returns 0% for zero impressions", () => {
    expect(calcCTR(0, 0)).toBe("0%");
  });

  test("calculates correct CTR", () => {
    expect(calcCTR(100, 10)).toBe("10.0%");
    expect(calcCTR(200, 15)).toBe("7.5%");
    expect(calcCTR(1000, 1)).toBe("0.1%");
  });

  test("handles 100% CTR", () => {
    expect(calcCTR(5, 5)).toBe("100.0%");
  });
});

describe("truncate", () => {
  test("returns full string when short enough", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  test("truncates long strings with ellipsis", () => {
    const result = truncate("Hello World this is a long string", 11);
    expect(result).toBe("Hello World...");
    expect(result.length).toBe(14);
  });
});

describe("isArabicText", () => {
  test("detects Arabic characters", () => {
    expect(isArabicText("مرحبا")).toBe(true);
    expect(isArabicText("Hello مرحبا")).toBe(true);
  });

  test("returns false for non-Arabic text", () => {
    expect(isArabicText("Hello World")).toBe(false);
    expect(isArabicText("123456")).toBe(false);
    expect(isArabicText("")).toBe(false);
  });
});
