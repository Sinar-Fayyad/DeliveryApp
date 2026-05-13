import { v4 } from "uuid"; // generates a unique ID for each restaurant

import OrderItem from "./OrderItem.mjs"; // OrderItem represents a single item on the menu

export default class Restaurant {
  // The owner should be Restaurant Manager instance
  constructor(restaurantName, owner) {
    this.restaurantId = v4(); // unique identifier for this restaurant
    this.restaurantName = restaurantName;
    // COMPOSITION: Connects the Restaurant with its owner
    // THE owner would be a Restaurant Manager instance class
    this.owner = owner; // stores a reference to the RestaurantManager who owns this restaurant
    // COMPOSITION: Connects the Restaurant Menu with the Items
    // IT has a relationship with another class here the Order item
    this.menu = []; // starts with an empty menu — items are added via addItemToMenu()
  }

  addItemToMenu(name, price, description) {
    // OrderItem is a class to relate to
    const newItem = new OrderItem(name, price, description); // creates a new menu item instance with its own UUID
    // We add OrderITems to the list menu
    this.menu.push(newItem); // appends the new item to the restaurant's menu array
    // menu = [OrderITem , OrderItem , OrderItem]
    return newItem; // returns the created item so the caller can use it if needed
  }

  getMenu() {
    // Go over the list of menu
    // The list of menu holds OrderITems
    return this.menu.map((item) => item.getItemInfo()); // maps each OrderItem to a plain object via getItemInfo()
  }

  findItemByName(itemName) {
    // Typically we call this from a DB or Storage
    // HERE item is an instance of OrderItem
    return this.menu.find((item) => item.name == itemName) ?? null; // returns the matching OrderItem instance or null if not found
  }
}

// ---- MISSING ----
// No RestaurantRepository — restaurant data is only held in memory, never persisted to the DB
// findItemByName() uses == instead of === — loose equality could cause unexpected matches
