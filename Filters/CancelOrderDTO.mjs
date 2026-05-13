// Used by: POST /order/cancel  (OrderController.cancel)
// Raw input keys from the hidden form input: orderId

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CancelOrderDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    this.orderId = (rawData.orderId ?? "").toString().trim();

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    // orderId comes from a hidden <input> in Customer-OrderView.html.
    // It was originally written by the server, but the client can tamper
    // with it before submitting — so we must validate its format.
    if (!UUID_REGEX.test(this.orderId)) {
      errors.push("orderId must be a valid UUID");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
