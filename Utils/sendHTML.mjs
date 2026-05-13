import fs from "node:fs"; // reads HTML files from disk
import path from "node:path"; // builds OS-safe absolute file paths
import { fileURLToPath } from "node:url"; // converts import.meta.url to a file system path

const __dirName = path.dirname(fileURLToPath(import.meta.url)); // resolves current directory (ESM equivalent of __dirname)

// reads an HTML file from Views/ and sends it as a 200 response
export const sendHTML = async (res, filename) => {
  const html = await fs.promises.readFile(
    path.join(__dirName, `../Views/${filename}`), // builds the absolute path to the view file
    "utf-8",
  );
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); // tells the browser to expect HTML
  res.end(html); // sends the HTML body and closes the response
};
