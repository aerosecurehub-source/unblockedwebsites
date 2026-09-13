import http from "node:http";
import worker from "./src/index.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    const fullUrl = `http://${req.headers.host || "localhost"}${req.url}`;
    const fetchRequest = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
    });

    const response = await worker.fetch(fetchRequest);

    res.statusCode = response.status;
    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    res.statusCode = 500;
    res.end("Internal Server Error: " + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
