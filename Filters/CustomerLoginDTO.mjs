// Used by: POST /auth/login  (AuthController.login)
// Raw input keys from the HTML form: userEmail, password

export class CustomerLoginDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    this.email    = (rawData.userEmail ?? "").toString().trim().toLowerCase();
    this.password = (rawData.password  ?? "").toString();

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    // On login we still check format — if it is not a valid email it will
    // never exist in the DB, so we can reject early without hitting the DB.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      errors.push("Email must be a valid email address");
    }

    // Max length guard — prevents sending a 10 KB email string to the DB query
    if (this.email.length > 100) {
      errors.push("Email must be 100 characters or less");
    }

    // On login we do NOT enforce minlength on the password.
    // If the password is wrong the model will reject it via bcrypt anyway.
    // We only check it is not completely empty.
    if (this.password.length === 0) {
      errors.push("Password is required");
    }

    // Max length still required to prevent the bcrypt DoS attack on login too.
    if (this.password.length > 128) {
      errors.push("Password must be 128 characters or less");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
