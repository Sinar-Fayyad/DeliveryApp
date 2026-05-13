import fs from "node:fs"; // reads HTML template files from disk
import path from "node:path"; // builds OS-safe absolute file paths
import { fileURLToPath } from "node:url"; // converts import.meta.url to a file system path

const __dirName = path.dirname(fileURLToPath(import.meta.url)); // resolves current directory (ESM equivalent of __dirname)

// reads an HTML template, replaces every {{key}} with the matching value from data, and sends the result
export const renderHTML = async (res, filename, data = {}) => {
  let html = await fs.promises.readFile(
    path.join(__dirName, `../Views/${filename}`), // builds the absolute path to the template file
    "utf-8",
  );

  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value); // replaces every occurrence of {{key}} with its value
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); // tells the browser to expect HTML
  res.end(html); // sends the fully rendered page and closes the response
};
