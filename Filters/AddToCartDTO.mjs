// Used by: POST /cart/add  (OrderController.addToCart)
// Raw input keys from the hidden form inputs: restaurantId, itemName, itemPrice
//
// These values originate from the database (injected into the menu page by
// PageController.restaurantMenu) and come back through a hidden <input>.
// They are still user-controlled — anyone can POST any value they want.

// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AddToCartDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    this.restaurantId = (rawData.restaurantId ?? "").toString().trim();
    this.itemName     = (rawData.itemName     ?? "").toString().trim();
    this.itemPrice    = parseFloat(rawData.itemPrice ?? "");

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    // RESTAURANT ID — must be a valid UUID v4
    // We validate the format here so we reject garbage before touching the DB.
    // The parameterised query would still protect against SQL injection even
    // without this check, but a UUID check gives cleaner, earlier rejection.
    if (!UUID_REGEX.test(this.restaurantId)) {
      errors.push("restaurantId must be a valid UUID");
    }

    // ITEM NAME — must not be empty and must fit the DB column
    if (this.itemName.length === 0) {
      errors.push("Item name is required");
    }
    if (this.itemName.length > 100) {
      errors.push("Item name must be 100 characters or less");
    }

    // ITEM PRICE — must be a valid positive number
    if (isNaN(this.itemPrice) || !isFinite(this.itemPrice)) {
      errors.push("Item price must be a number");
    } else if (this.itemPrice < 0) {
      errors.push("Item price cannot be negative");
    } else if (this.itemPrice > 9999.99) {
      errors.push("Item price must be 9999.99 or less");
    } else {
      this.itemPrice = Math.round(this.itemPrice * 100) / 100;
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
