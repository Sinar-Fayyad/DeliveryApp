export default class User {
  // An abstract Class — cannot be instantiated directly, only extended

  constructor(userId) {
    if (this.constructor === User) {
      throw new Error("You cannot instantiate an Abstract Class `User`"); // enforces that only subclasses can be instantiated
    }
    this.userId = userId; // every user type (Customer, Courrier, Manager) shares this base property
  }

  // These static methods act as an abstract contract — every subclass MUST override them
  static async register() {
    if (this == User) {
      throw new Error("Cannot call register() from an abstract class"); // blocks direct calls on User itself
    }
    throw new Error(`${this.name} must implement the register()`); // forces subclasses that forgot to override to fail loudly
  }

  static async login() {
    if (this == User) {
      throw new Error("Cannot call login() from an abstract class");
    }
    throw new Error(`${this.name} must implement the login()`);
  }

  static async logout() {
    if (this == User) {
      throw new Error("Cannot call logout() from an abstract class");
    }
    throw new Error(`${this.name} must implement the logout()`);
  }
}

// ---- MISSING ----
// No instance methods (e.g. getProfile()) — currently only static auth methods are defined
