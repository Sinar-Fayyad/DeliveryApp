import fs from "node:fs"; // reads CSS files from disk
import path from "node:path"; // builds OS-safe absolute file paths
import { fileURLToPath } from "node:url"; // converts import.meta.url to a file system path

const __dirName = path.dirname(fileURLToPath(import.meta.url)); // resolves current directory (ESM equivalent of __dirname)

// reads a CSS file from Views/Styles/ and sends it as a 200 response
export const sendCSS = async (res, filename) => {
  const css = await fs.promises.readFile(
    path.join(__dirName, `../Views/Styles/${filename}`), // builds the absolute path to the stylesheet
    "utf-8",
  );
  res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" }); // tells the browser to expect CSS
  res.end(css); // sends the CSS body and closes the response
};
