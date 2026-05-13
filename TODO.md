# DeliveryApp — Student Implementation Guide

This file is your roadmap for the three remaining pieces of infrastructure that
are **not yet built** in the project.  Read each section carefully before you
write any code — understanding *why* first will save you a lot of debugging.

---

## 1. The `Logger` Class

### What it is and why you need it
Right now the codebase is full of `console.log(...)` calls.  That is fine for a
quick experiment, but it has three problems:

- You cannot turn it off in production without deleting every line.
- You cannot tell *where* in the code a message came from without reading the
  stack trace.
- You cannot write logs to a file — they just appear in the terminal and
  disappear.

A `Logger` class fixes all of this by giving every log message a **level**
(`DEBUG`, `INFO`, `WARN`, `ERROR`) and a **timestamp**, and by deciding at
startup whether to print to the console, write to a file, or both.

### Where to put it
Create the file at `Utils/Logger.mjs`.

### What to implement

```js
// Utils/Logger.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirName = path.dirname(fileURLToPath(import.meta.url));

// Log levels in ascending severity order.
// Only messages at or above the configured level will be written.
const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

export default class Logger {
  // TODO: add a #level private field — read it from process.env.LOG_LEVEL
  //       (default to "INFO" if the env variable is not set).

  // TODO: add a #logFile private field — a writable stream opened with
  //       fs.createWriteStream().  The file should live in ../Logs/app.log
  //       relative to this file.  Open it with { flags: "a" } so each server
  //       restart *appends* instead of overwriting.

  // TODO: implement a #write(level, message) private method that:
  //   1. Checks whether LEVELS[level] >= LEVELS[this.#level].
  //      If not, return early.
  //   2. Builds a formatted string:
  //        [2026-05-04T12:00:00.000Z] [INFO]  Something happened
  //      Use new Date().toISOString() for the timestamp.
  //   3. Writes the string to the console AND appends it to this.#logFile.

  // TODO: implement four public methods that each call #write with their level:
  //   debug(message) { this.#write("DEBUG", message); }
  //   info(message)  { ... }
  //   warn(message)  { ... }
  //   error(message) { ... }
}

// Export a single shared instance so all files use the same log file.
export const logger = new Logger();
```

### How to use it once built
Replace every `console.log(...)` with the shared logger instance:

```js
// at the top of any controller or model:
import { logger } from "../Utils/Logger.mjs";

// inside a handler:
logger.info("Order created: " + orderId);
logger.error("Database query failed: " + err.message);
```

### Testing your Logger
Add a `LOG_LEVEL=DEBUG` line to your `.env`, restart the server, and make a
request.  You should see timestamped lines in the terminal **and** in
`Logs/app.log`.  Then change `LOG_LEVEL=ERROR` — only error messages should
appear.

---

## 2. The `Config` Class

### What it is and why you need it
The app reads `process.env.DB_HOST`, `process.env.PORT`, etc. directly in
`Database.mjs` and `index.mjs`.  This is fragile because:

- If a variable name has a typo you only find out at runtime when something
  crashes.
- There is no central place to see *all* the settings the app needs.
- You cannot set default values for optional settings.

A `Config` class solves this by reading all environment variables **once at
startup**, validating that the required ones are present, and exposing them as
named properties.

### Where to put it
Create the file at `Utils/Config.mjs`.

### What to implement

```js
// Utils/Config.mjs
import "dotenv/config";

export default class Config {
  static #instance = null;

  static getInstance() {
    if (!Config.#instance) Config.#instance = new Config();
    return Config.#instance;
  }

  constructor() {
    // TODO: assign every env variable the app needs to a public property.
    //       Required variables should throw if they are missing.
    //       Optional ones should fall back to a sensible default.
    //
    //   this.port           = Number(process.env.PORT)             // required
    //   this.dbHost         = process.env.DB_HOST                  // required
    //   this.dbPort         = Number(process.env.DB_PORT)          // required
    //   this.dbUser         = process.env.DB_USER                  // required
    //   this.dbPassword     = process.env.DB_PASSWORD              // required
    //   this.dbName         = process.env.DB_NAME                  // required
    //   this.dbConnLimit    = Number(process.env.DB_CONNECTION_LIMIT ?? "10")
    //   this.dbQueueLimit   = Number(process.env.DB_QUEUE_LIMIT    ?? "0")
    //   this.logLevel       = process.env.LOG_LEVEL                ?? "INFO"

    // TODO: call this.#validate() at the end of the constructor.
  }

  // TODO: implement #validate().
  // Loop over the required fields and throw a descriptive error for any
  // that are undefined or NaN.
  // Example error: "Missing required config: DB_HOST"
  #validate() {}
}
```

### How to use it once built
Replace every `process.env.*` call in the codebase with `Config.getInstance().*`:

```js
// Database.mjs — before
host: process.env.DB_HOST,

// Database.mjs — after
import Config from "../Utils/Config.mjs";
const config = Config.getInstance();
// ...
host: config.dbHost,
```

Do the same in `index.mjs` for `process.env.PORT`.

### Testing your Config
Temporarily delete a required variable from your `.env` and restart the server.
You should see a clear error like `"Missing required config: DB_HOST"` instead
of a cryptic crash deep inside mysql2.

---

## 3. Implementing `logout()` on the User Subclasses

### The problem
The base class `User` defines `static logout()` as an abstract method that
throws `"must implement"`.  The three subclasses — `Customer`, `Courrier`, and
`RestaurantManager` — never override it, so calling it crashes the server.

Look at how the controllers handle logout today (example from `AuthController`):

```js
logout: async (req, res) => {
  await revokeToken(req);                                         // deletes the DB session row
  res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0"); // clears the cookie
  res.writeHead(302, { Location: "/login" });
  res.end();
}
```

The controller is already doing the right work.  Your job is to move the session
logic into the model so the controller can delegate to it cleanly.

### What to implement

In **each** of `Models/Customer.mjs`, `Models/Courrier.mjs`, and
`Models/RestaurantManager.mjs`, override the static `logout` method:

```js
// Add this import at the top of each model file:
import { revokeToken } from "../Utils/token.mjs";

// Inside the class body:
static async logout(req, res) {
  await revokeToken(req);  // deletes the Session row from the DB
  res.setHeader("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0");
}
```

Then simplify the controllers to call the model:

```js
// AuthController.mjs — after your change
logout: async (req, res) => {
  await Customer.logout(req, res);   // model handles token revocation
  res.writeHead(302, { Location: "/login" });
  res.end();
}
```

Do the same for `CourrierController` (calling `Courrier.logout`) and
`RestaurantController` (calling `RestaurantManager.logout`).

### Why `static`?
Logout does not need a specific Customer *instance* — it only needs the HTTP
request (to read the token cookie) and the HTTP response (to clear the cookie).
Static methods in JavaScript belong to the class itself, not to an object, so
they are called as `Customer.logout(req, res)` rather than
`someCustomer.logout(req, res)`.

---

## 4. How Session-Based Cookies Work in This App

This section explains the full request lifecycle so you understand the code you
are reading, not just how to copy it.

### The flow in plain English

```
Browser                        Server                         Database
  |                               |                               |
  |  POST /auth/login             |                               |
  |  email=x&password=y -------> |                               |
  |                               |  bcrypt.compare(y, hash)      |
  |                               |  match ✓                      |
  |                               |                               |
  |                               |  randomBytes(32) → token      |
  |                               |  INSERT INTO Session -------> |
  |                               |  (token, userId, role, ...)   |
  |                               |                               |
  |  Set-Cookie: token=abc...     |                               |
  | <---------------------------- |                               |
  |  302 → /home                  |                               |
  |                               |                               |
  |  GET /home                    |                               |
  |  Cookie: token=abc... ------> |                               |
  |                               |  SELECT * FROM Session        |
  |                               |  WHERE token='abc...' ------> |
  |                               |  row found ✓                  |
  |  200 OK + home page           |                               |
  | <---------------------------- |                               |
  |                               |                               |
  |  POST /auth/logout            |                               |
  |  Cookie: token=abc... ------> |                               |
  |                               |  DELETE FROM Session          |
  |                               |  WHERE token='abc...' ------> |
  |  Set-Cookie: token=; Max-Age=0|                               |
  |  302 → /login                 |                               |
  | <---------------------------- |                               |
```

### The three functions in `Utils/token.mjs`

| Function | When called | What it does |
|---|---|---|
| `issueToken(res, user, role)` | After successful login | Generates a random 64-char hex token, inserts a row into the `Session` table, sets an `HttpOnly` cookie on the response |
| `verifyToken(req)` | Start of every protected handler | Reads the `token` cookie, looks it up in `Session`, returns the row (`userId`, `role`, `userEmail`, ...) — throws if missing or not found |
| `revokeToken(req)` | On logout | Reads the `token` cookie, deletes the matching `Session` row — then the controller clears the cookie with `Max-Age=0` |

### Why `HttpOnly`?
The cookie is set with the `HttpOnly` flag, which means **JavaScript running in
the browser cannot read it**.  This protects against XSS attacks — even if an
attacker injects a script into your page, the script cannot steal the session
token.

### Why not JWT?
A JWT is self-contained: the server can verify it without a database lookup.
But it cannot be invalidated before it expires — if a user logs out, the JWT is
still valid until its expiry time.  This app uses **opaque session tokens**
stored in MySQL instead.  The trade-off: every protected request costs one extra
DB query, but logout is instant and reliable.

### Common mistakes to avoid

1. **Never send the token in a URL query string** (`/home?token=abc...`).  URLs
   are logged by proxies and appear in browser history — treat the token like a
   password.

2. **Always check the token at the start of a handler** before reading any other
   data from the request.  If `verifyToken` throws, return an error immediately.

3. **Always revoke the token server-side on logout** — clearing the cookie
   client-side alone is not enough.  If the user's machine is compromised, the
   attacker could still have a copy of the old cookie value.  Deleting the
   `Session` row makes it permanently invalid.
