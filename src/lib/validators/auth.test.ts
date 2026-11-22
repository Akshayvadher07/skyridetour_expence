import assert from "node:assert/strict";
import { registrationSchema } from "./auth";

const validInput = {
  name: "Sample Client",
  email: "CLIENT@EXAMPLE.COM",
  phone: "+1 (555) 010-1234",
  password: "StrongPass1",
  confirmPassword: "StrongPass1",
};

const parsed = registrationSchema.safeParse(validInput);
assert.equal(parsed.success, true);
if (parsed.success) {
  assert.equal(parsed.data.email, "client@example.com");
}

assert.equal(
  registrationSchema.safeParse({ ...validInput, confirmPassword: "Different1" }).success,
  false
);
assert.equal(
  registrationSchema.safeParse({ ...validInput, password: "weakpass", confirmPassword: "weakpass" }).success,
  false
);
assert.equal(
  registrationSchema.safeParse({ ...validInput, phone: "not a phone" }).success,
  false
);

console.log("Registration validation checks passed.");