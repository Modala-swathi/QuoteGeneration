import fetch from "node-fetch";
import express from "express";
const app = express();

// Use environment variables for flexibility
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.static("public"));

app.get("/quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    res.json(data); // Send the API response to frontend
  } catch (error) {
    console.error("Error fetching quote:", error.message);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

// Listen on all network interfaces
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
