// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";
import { getConfigError } from "./route";

describe("getConfigError", () => {
  const original = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    // Restore the original value after each test
    if (original === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = original;
    }
  });

  it("returns null when a real key is set", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-api03-realkey";
    expect(getConfigError()).toBeNull();
  });

  it("returns an error string when the key is absent", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(getConfigError()).toMatch(/not set/i);
  });

  it("returns an error string when the key is an empty string", () => {
    process.env.ANTHROPIC_API_KEY = "";
    expect(getConfigError()).toMatch(/not set/i);
  });

  it("returns an error string when the key is whitespace only", () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    expect(getConfigError()).toMatch(/not set/i);
  });

  it("returns an error string for the placeholder value", () => {
    process.env.ANTHROPIC_API_KEY = "placeholder_for_local_dev";
    expect(getConfigError()).toMatch(/placeholder/i);
  });
});
