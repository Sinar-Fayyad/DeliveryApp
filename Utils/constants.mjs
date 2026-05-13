// HERE we put the constants that we stay like this across all files of the application
// They should not be affected by the development environment or device.

export const OrderStatus = Object.freeze({
  // Object.freeze() prevents any modification to this object at runtime
  DELIVERED: "Delivered",
  ONTHEWAY: "On the way",
  PREPARING: "Preparing",
  SUBMITTED: "Submitted",
  INCOMPLETE: "Incomplete Cart",
});

export const UserRoles = Object.freeze({
  // frozen object — role values cannot be changed or added at runtime
  CUSTOMER: "Customer",
  COURRIER: "Courrier",
  MANAGER: "Manager",
});

export const SALT_ROUNDS = 10; // bcrypt cost factor — higher = more secure but slower hashing

export const OrderLimits = Object.freeze({
  // frozen object — enforces business rules as constants
  MAX_ITEMS_PER_ORDER: 20, // a single order cannot exceed 20 items
  MAX_ACTIVE_ORDERS: 5, // a customer cannot have more than 5 active orders at once
});

export const HTTP_STATUS = Object.freeze({
  // standard HTTP status codes — used in controllers when sending responses
  OK: 200, // request succeeded
  CREATE: 201, // resource successfully created
  TEMP_REDIRECT: 302, // temporary redirection to another URL
  BAD_REQUEST: 400, // client sent invalid data
  UNAUTHORIZED: 401, // client is not authenticated
  NOT_FOUND: 404, // requested resource does not exist
  SERVER_ERROR: 500, // unexpected server-side failure
});
