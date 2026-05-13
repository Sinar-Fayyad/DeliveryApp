import { verifyToken } from "../Utils/token.mjs";

// ─── Guard ────────────────────────────────────────────────────────────────────
// A single, chainable class that sits between the router and any logic that
// requires the user to be identified or permitted.
//
// Usage pattern inside a controller:
//
//   const { userId } = new Guard()
//     .authenticate(req)           // Step 1 — is anyone logged in?
//     .authorize("Manager")        // Step 2 — is it the right role?
//     .payload;                    // Step 3 — give me the decoded identity
//
// Every method throws on failure.
// The controller's existing try/catch block catches those throws and sends the
// appropriate error response — no extra wiring needed.
// ─────────────────────────────────────────────────────────────────────────────

export class Guard {
  #payload = null; // the decoded JWT payload, populated by authenticate()

  // ── Step 1: Authentication ────────────────────────────────────────────────
  // Reads the JWT from the request cookie, verifies its signature and expiry,
  // and stores the decoded payload for use by the next guard steps.
  // Throws if the cookie is missing, the token is tampered with, or it expired.
  async authenticate(req) {
    this.#payload = await verifyToken(req);
    return this;
  }

  // ── Step 2: Role-based Authorization ─────────────────────────────────────
  // Checks that the authenticated user's role is one of the allowed roles.
  // Pass one or more roles: .authorize("Manager") or .authorize("Customer", "Manager")
  // Throws if the user's role is not in the allowed list.
  // Must be called after authenticate().
  authorize(...allowedRoles) {
    if (!this.#payload) {
      throw new Error("Guard: call authenticate() before authorize()");
    }
    if (!allowedRoles.includes(this.#payload.role)) {
      throw new Error(
        `Guard: role '${this.#payload.role}' is not permitted. Required: [${allowedRoles.join(", ")}]`
      );
    }
    return this;
  }

  // ── Step 3: Ownership Authorization ──────────────────────────────────────
  // Checks that the authenticated user IS the owner of the resource being acted on.
  // Example: a customer can only cancel their OWN order, not someone else's.
  // Pass the ownerId field read from the DB row.
  // Throws if the token's userId does not match.
  // Must be called after authenticate().
  requireOwnership(resourceOwnerId) {
    if (!this.#payload) {
      throw new Error("Guard: call authenticate() before requireOwnership()");
    }
    if (this.#payload.userId !== resourceOwnerId) {
      throw new Error("Guard: user does not own this resource");
    }
    return this;
  }

  // ── Payload Accessor ──────────────────────────────────────────────────────
  // Returns the decoded JWT payload: { userId, role, userEmail, restaurantName }
  // Read this after the guard chain to get the caller's identity.
  get payload() {
    if (!this.#payload) {
      throw new Error("Guard: not authenticated yet — call authenticate() first");
    }
    return this.#payload;
  }
}
