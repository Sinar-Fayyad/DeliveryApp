import Database from "./Database.mjs"; // imports the singleton Database to access the shared connection pool

export default class RestaurantManagerRepository {
  #database; // private field to hold the Database instance
  constructor() {
    this.#database = Database.getInstance(); // fetches the singleton — never creates a new connection pool
  }

  // CREATE
  async createManager(userId, restaurantName, hashedPassword) {
    await this.#database.query(
      `INSERT INTO RestaurantManager(userId, restaurantName, passwordHash) VALUES (?, ?, ?)`, // inserts a new manager row
      [userId, restaurantName, hashedPassword], // parameterized — prevents SQL injection
    );
  }

  // READ
  async findByRestaurantName(restaurantName) {
    const [rows] = await this.#database.query(
      `SELECT * FROM RestaurantManager WHERE restaurantName = ?`, // looks up a manager by their restaurant name
      [restaurantName],
    );
    if (rows.length === 0) return null; // no match found
    return rows[0]; // returns the first matching row as a plain object
  }

  async findById(userId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM RestaurantManager WHERE userId = ?`, // looks up a manager by their unique ID
      [userId],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  // UPDATE

  // DELETE
}
