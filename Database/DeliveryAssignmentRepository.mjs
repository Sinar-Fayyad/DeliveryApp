import Database from "./Database.mjs"; // imports the singleton Database to access the shared connection pool

export default class DeliveryAssignmentRepository {
  #database; // private field to hold the Database instance
  constructor() {
    this.#database = Database.getInstance(); // fetches the singleton — never creates a new connection pool
  }

  // CREATE
  async createAssignment(assignmentId, orderId, courierId, status) {
    await this.#database.query(
      `INSERT INTO DeliveryAssignment(assignmentId, orderId, courierId, status) VALUES (?, ?, ?, ?)`, // inserts a new assignment row
      [assignmentId, orderId, courierId, status], // parameterized — prevents SQL injection
    );
  }

  // READ
  async findByOrderId(orderId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM DeliveryAssignment WHERE orderId = ?`, // looks up the assignment for a specific order
      [orderId],
    );
    if (rows.length === 0) return null; // no assignment exists for this order yet
    return rows[0]; // returns the first matching row as a plain object
  }

  async findByCourierId(courierId) {
    const [rows] = await this.#database.query(
      `SELECT * FROM DeliveryAssignment WHERE courierId = ?`, // fetches all assignments for a given courrier
      [courierId],
    );
    return rows; // returns all matching rows — used to populate the courrier dashboard
  }

  // UPDATE
  async updateStatus(assignmentId, status) {
    await this.#database.query(
      `UPDATE DeliveryAssignment SET status = ? WHERE assignmentId = ?`, // changes the delivery status in place
      [status, assignmentId], // parameterized — prevents SQL injection
    );
  }

  // DELETE
}
