import Database from "./Database.mjs"; // imports the singleton Database class to get the shared connection pool

export default class CustomerRepository {
  #database; // private field to hold the Database instance

  constructor() {
    this.#database = Database.getInstance(); // fetches (or creates) the single Database instance — never creates a new connection pool
  }

  // CREATE
  async createUser(userId, email, hashedPassword) {
    await this.#database.query(
      `INSERT INTO Customer(userId, email, passwordHash) VALUES (?, ?, ?)`, // ? placeholders prevent SQL injection
      [userId, email, hashedPassword], // values are passed separately and safely escaped by mysql2
    );
  }

  // READ
  async findByEmail(email) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Customer WHERE email = ?`, // looks up a customer by their email address
      [email],
    );
    if (rows.length === 0) return null; // no match found — returns null instead of throwing
    return rows[0]; // returns the first (and only expected) matching row as a plain object
  }

  async findCustomerById(customerId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Customer WHERE userId = ?`,
      [customerId],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  // UPDATE

  // DELETE
}

