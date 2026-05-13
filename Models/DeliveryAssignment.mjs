import { v4 } from "uuid"; // generates a unique ID for each assignment
import { OrderStatus } from "../Utils/constants.mjs"; // status constants shared across order-related models
import DeliveryAssignmentRepository from "../Database/DeliveryAssignmentRepository.mjs"; // persists assignments to the DB

const repository = new DeliveryAssignmentRepository(); // single repository instance reused across all static calls

export default class DeliveryAssignment {
  constructor(orderId, courierId) {
    this.assignmentId = v4(); // unique identifier for this assignment
    this.orderId = orderId; // links the assignment to the order being delivered
    this.courierId = courierId; // links the assignment to the courrier who will deliver it
    this.status = OrderStatus.SUBMITTED; // every new assignment starts at Submitted
  }

  // creates a new assignment, persists it, and returns the instance
  static async create(orderId, courierId) {
    const assignment = new DeliveryAssignment(orderId, courierId); // builds the instance with a fresh uuid
    await repository.createAssignment(assignment.assignmentId, assignment.orderId, assignment.courierId, assignment.status); // writes to DB
    return assignment; // returns the persisted instance to the caller
  }

  // updates the status of an existing assignment in the DB
  static async updateStatus(assignmentId, newStatus) {
    await repository.updateStatus(assignmentId, newStatus); // delegates to repository — no in-memory state to sync
  }
}
