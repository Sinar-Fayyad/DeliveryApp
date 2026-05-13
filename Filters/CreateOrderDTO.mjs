// Used by: POST /order/create  (OrderController.create)
// Raw input keys from the hidden form input: restaurantId

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreateOrderDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    this.restaurantId = (rawData.restaurantId ?? "").toString().trim();

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    if (!UUID_REGEX.test(this.restaurantId)) {
      errors.push("restaurantId must be a valid UUID");
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
