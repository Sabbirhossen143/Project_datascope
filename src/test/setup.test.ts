import { describe, expect, it } from "vitest";

describe("DataScope testing environment", () => {
  it("should support the DOM environment", () => {
    const element = document.createElement("div");
    element.textContent = "DataScope";
    expect(element).toHaveTextContent("DataScope");
  });
});
