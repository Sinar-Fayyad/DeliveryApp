import { v4 } from "uuid"; // generates a unique ID for each order

export default class Order {
  #items; // private field — the list of OrderItem instances in this order, not accessible from outside

  constructor(customerId, restaurant) {
    this.orderId = v4(); // unique identifier for this order
    this.customerId = customerId; // links the order to the customer who placed it
    this.restaurant = restaurant; // links the order to the restaurant it was placed at — a Restaurant instance
    this.#items = []; // starts with an empty items list
    this.totalPrice = 0; // running total — updated each time an item is added
  }

  addItems(itemName) {
    // CHICKEN BURGER
    // Created an instance of new item  byt searching it in the meny of the restaurant
    const newItem = this.restaurant.findItemByName(itemName); // CHICKEN BURGER — looks up the item in the restaurant's menu
    // Added this new instance to the private list of items in this order
    this.#items.push(newItem); // adds the found OrderItem to this order's private list
    // Added the price to the whole(total) price of the order
    this.totalPrice += newItem.price; // accumulates the total price of the order
  }

  getItems() {
    // Item is an instance of OrderItem
    return this.#items.map((item) => item.getItemInfo()); // maps each OrderItem to a plain object via getItemInfo()
  }
}

// ---- MISSING ----
// addItems() will crash if findItemByName() returns null — no guard against items not found in the menu
// No OrderRepository — orders are only held in memory, never persisted to the DB
// No removeItem() method
// No order status tracking — OrderStatus constants from Utils/constants.mjs exist but are unused here
