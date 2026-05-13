import Database from "./Database.mjs"; // imports the singleton Database to access the shared connection pool

export default class OrderRepository {
  #database; // private field to hold the Database instance
  constructor() {
    this.#database = Database.getInstance(); // fetches the singleton — never creates a new connection pool
  }

  // CREATE
  async createOrder(orderId, customerId, restaurantId, status) {
    await this.#database.query(
      `INSERT INTO \`Order\`(orderId, customerId, restaurantId, status) VALUES (?, ?, ?, ?)`, // inserts a new order row
      [orderId, customerId, restaurantId, status], // parameterized — prevents SQL injection
    );
  }

  async addOrderItem(orderId, itemName, price) {
    await this.#database.query(
      `INSERT INTO OrderItem(orderId, itemName, price, quantity) VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE quantity = quantity + 1`,
      [orderId, itemName, price],
    );
  }

  // READ
  async findById(orderId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM \`Order\` WHERE orderId = ?`, // looks up an order by its unique ID
      [orderId],
    );
    if (rows.length === 0) return null; // no order found
    return rows[0]; // returns the order row as a plain object
  }

  async findByCustomerId(customerId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM \`Order\` WHERE customerId = ?`, // fetches all orders placed by a customer
      [customerId],
    );
    return rows; // returns all matching rows — used to list a customer's orders
  }

  async findItemsByOrderId(orderId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM OrderItem WHERE orderId = ?`, // fetches all items belonging to an order
      [orderId],
    );
    return rows; // returns all item rows for this order
  }

  async findByRestaurantId(restaurantId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM \`Order\` WHERE restaurantId = ? AND status != ?`, // fetches active orders for a restaurant — used by the manager dashboard
      [restaurantId, "Incomplete Cart"],
    );
    return rows; // returns all non-cancelled orders for this restaurant
  }

  async findCartOrder(customerId, restaurantId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM \`Order\` WHERE customerId = ? AND restaurantId = ? AND status = ?`,
      [customerId, restaurantId, "Incomplete Cart"],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async findActiveByCustomerId(customerId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM \`Order\` WHERE customerId = ? AND status NOT IN (?, ?)`,
      [customerId, "Delivered", "Incomplete Cart"],
    );
    return rows;
  }

  // UPDATE
  async updateStatus(orderId, status) {
    await this.#database.query(
      `UPDATE \`Order\` SET status = ? WHERE orderId = ?`, // changes the order status in place
      [status, orderId], // parameterized — prevents SQL injection
    );
  }

  // DELETE
}
