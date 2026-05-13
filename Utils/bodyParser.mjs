// reads the raw POST body from the request stream and returns it as a plain object
export const parseBody = (req) =>
  new Promise((resolve) => {
    let raw = ""; // accumulates incoming data chunks from the request stream
    req.on("data", (chunk) => (raw += chunk)); // appends each chunk as it arrives
    req.on("end", () => resolve(Object.fromEntries(new URLSearchParams(raw)))); // decodes URL-encoded body into a key-value object once stream ends
  });
