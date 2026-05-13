import Database from "./Database.mjs"; // imports the singleton Database to access the shared connection pool

export default class RestaurantRepository {
  #database; // private field to hold the Database instance
  constructor() {
    this.#database = Database.getInstance(); // fetches the singleton — never creates a new connection pool
  }

  // CREATE
  async createRestaurant(restaurantId, restaurantName, managerId) {
    await this.#database.query(
      `INSERT INTO Restaurant(restaurantId, restaurantName, managerId) VALUES (?, ?, ?)`, // inserts a new restaurant row
      [restaurantId, restaurantName, managerId], // parameterized — prevents SQL injection
    );
  }

  async addMenuItem(itemId, restaurantId, name, price, description) {
    await this.#database.query(
      `INSERT INTO MenuItem(itemId, restaurantId, name, price, description) VALUES (?, ?, ?, ?, ?)`, // inserts a new menu item for this restaurant
      [itemId, restaurantId, name, price, description ?? null], // description is optional
    );
  }

  // READ
  async findAll() {
    const [rows] = await this.#database.query(
      `SELECT * FROM Restaurant`, // fetches every restaurant — used to populate the customer home page
      [],
    );
    return rows; // returns all restaurant rows as plain objects
  }

  async findById(restaurantId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Restaurant WHERE restaurantId = ?`, // looks up a restaurant by its unique ID
      [restaurantId],
    );
    if (rows.length === 0) return null; // no restaurant found
    return rows[0]; // returns the restaurant row as a plain object
  }

  async findByManagerId(managerId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Restaurant WHERE managerId = ?`, // looks up the restaurant owned by a given manager
      [managerId],
    );
    if (rows.length === 0) return null; // this manager has not created a restaurant yet
    return rows[0]; // a manager owns exactly one restaurant
  }

  async findMenuByRestaurantId(restaurantId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM MenuItem WHERE restaurantId = ?`, // fetches all menu items for a given restaurant
      [restaurantId],
    );
    return rows; // returns all menu item rows — empty array if no items added yet
  }

  // UPDATE

  // DELETE
}
