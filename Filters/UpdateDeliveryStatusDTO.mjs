// Used by: POST /courrier/status  (CourrierController.updateStatus)
// Raw input keys from the form in Dash-CourrierView.html: assignmentId, status

import { OrderStatus } from "../Utils/constants.mjs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class UpdateDeliveryStatusDTO {
  constructor(rawData) {

    // ── SANITIZE ──────────────────────────────────────────────────────────────
    this.assignmentId = (rawData.assignmentId ?? "").toString().trim();
    this.status       = (rawData.status       ?? "").toString().trim();

    // ── VALIDATE ──────────────────────────────────────────────────────────────
    this.#validate();
  }

  #validate() {
    const errors = [];

    // ASSIGNMENT ID
    if (!UUID_REGEX.test(this.assignmentId)) {
      errors.push("assignmentId must be a valid UUID");
    }

    // STATUS — whitelist check against your OrderStatus constants.
    //
    // This is the most critical validation in the entire DTO layer.
    //
    // The <select> in Dash-CourrierView.html only shows three options, but
    // the browser does NOT enforce that. Any POST request can send any string
    // as the status — a direct curl request bypasses the browser completely.
    //
    // Without this check, an attacker can write any arbitrary string into the
    // DeliveryAssignment.status column, breaking your app's logic everywhere
    // that reads and compares order statuses.
    //
    // Object.values(OrderStatus) produces:
    //   ["Delivered", "On the way", "Preparing", "Submitted", "Incomplete Cart"]
    const allowedStatuses = Object.values(OrderStatus);
    if (!allowedStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${allowedStatuses.join(", ")}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  }
}
