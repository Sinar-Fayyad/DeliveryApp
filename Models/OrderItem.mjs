import { v4 } from "uuid"; // generates a unique ID for each order item

export default class OrderItem {
  constructor(name, price, description) {
    this.orderItemId = v4(); // unique identifier for this item instance
    this.name = name; // item name (e.g. "Chicken Burger")
    this.price = price; // item price — used by Order to calculate totalPrice
    this.description = description; // short description of the item
  }

  // not STATIC — must be called on an instance, not on the class itself
  getItemInfo() {
    return {
      orderItemId: this.orderItemId,
      name: this.name,
      price: this.price,
      description: this.description, // returns a plain object snapshot of this item — safe to send as a response
    };
  }
}

// ---- MISSING ----
// No OrderItemRepository — items are only held in memory as part of a Restaurant's menu
// No quantity field — each call to addItems() adds a separate OrderItem instance instead of incrementing a count
