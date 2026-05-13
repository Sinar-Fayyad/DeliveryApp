import Database from "./Database.mjs"; // imports the singleton Database to access the shared connection pool

export default class CourrierRepository {
  #database; // private field to hold the Database instance
  constructor() {
    this.#database = Database.getInstance(); // fetches the singleton — never creates a new connection pool
  }

  // CREATE
  async createCourrier(userId, phoneNumber, hashedPassword) {
    await this.#database.query(
      `INSERT INTO Courrier(userId, phoneNumber, passwordHash) VALUES (?, ?, ?)`, // inserts a new courrier row
      [userId, phoneNumber, hashedPassword], // parameterized — prevents SQL injection
    );
  }

  // READ
  async findByPhoneNumber(phoneNumber) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Courrier WHERE phoneNumber = ?`, // looks up a courrier by their phone number
      [phoneNumber],
    );
    if (rows.length === 0) return null; // no match found
    return rows[0]; // returns the first matching row as a plain object
  }

  async findById(userId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM Courrier WHERE userId = ?`, // looks up a courrier by their unique ID
      [userId],
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  async findAll() {
    const [rows] = await this.#database.query(
      `SELECT userId, phoneNumber FROM Courrier`,
    );
    return rows;
  }

  // UPDATE

  // DELETE
}
