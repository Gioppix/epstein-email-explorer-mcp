import { z } from "zod/v4";

// Accepts string (comma-separated) or array, returns array
export const stringOrArray = z.preprocess(
  (val) => (typeof val === "string" ? val.split(",").map((s) => s.trim()).filter(Boolean) : val),
  z.array(z.string()).optional()
);
