// Used by: POST /auth/register  (AuthController.register)
// Raw input keys from the HTML form: userEmail, password

export class CustomerRegisterDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    // ?? "" guards against undefined (field missing from form body)
    // .toString() guards against any non-string type that might come through
    // .trim() removes accidental leading/trailing whitespace
    // .toLowerCase() normalises emails so "Me@Gmail.com" and "me@gmail.com"
    //   are treated as the same address — matches how we store them in the DB

    this.email    = (rawData.userEmail ?? "").toString().trim().toLowerCase();

    // Passwords must NOT be trimmed — a leading/trailing space is a valid
    // character the user intentionally typed
    this.password = (rawData.password ?? "").toString();

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    // EMAIL — basic format check: something @ something . something
    // Not a full RFC 5321 check, but catches the obvious cases
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      errors.push("Email must be a valid email address");
    }

    // EMAIL — max length must match the VARCHAR(100) in the Customer table
    if (this.email.length > 100) {
      errors.push("Email must be 100 characters or less");
    }

    // PASSWORD — minimum length: 8 characters is the industry-standard minimum
    if (this.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    // PASSWORD — maximum length: prevents the bcrypt DoS attack.
    // bcrypt is intentionally slow. Sending a 100,000-character password ties
    // up your Node.js event loop for seconds per request.
    if (this.password.length > 128) {
      errors.push("Password must be 128 characters or less");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
