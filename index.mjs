import "dotenv/config"; // loads .env file and injects all variables into process.env
import http from "node:http"; // built-in Node.js module to create HTTP servers — no framework needed
import { appRouter } from "./Controllers/AppRouter.mjs"; // imports the main dispatch function that handles all incoming requests

const PORT = process.env.PORT; // reads the PORT value from .env instead of hardcoding it


const server = await http.createServer(appRouter); // creates the HTTP server and hands every request to appRouter

server.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`); // confirms the server is up and which port it's bound to
});

// ---- MISSING ----
// await is unnecessary on http.createServer() — it is synchronous, not a Promise
