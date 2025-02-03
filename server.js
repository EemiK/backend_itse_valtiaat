const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
const fs = require("fs");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SHEET_ID;

// 📌 Get all data as objects with headers as keys
app.get("/api/sheet", async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "data",
        });

        const rows = response.data.values;
        if (!rows.length) return res.json([]);

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((key, index) => {
                obj[key] = row[index] || "";
            });
            return obj;
        });

        res.json(data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 📌 Get a single row by ID
app.get("/api/sheet/:id", async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "data",
        });

        const rows = response.data.values;
        if (!rows.length) return res.status(404).json({ error: "No data found" });

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            let obj = {};
            headers.forEach((key, index) => {
                obj[key] = row[index] || "";
            });
            return obj;
        });

        const item = data.find(row => row.ID === req.params.id);
        if (!item) return res.status(404).json({ error: "Item not found" });

        res.json(item);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// 📌 Update an existing row by ID
app.post("/api/sheet/:id", async (req, res) => {
    try {
        console.log("Received request to increment Points for ID:", req.params.id);
        console.log("Request body:", req.body);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "data",
        });

        console.log("Fetched Google Sheets Data:", response.data.values);

        const rows = response.data.values;
        if (!rows.length) return res.status(404).json({ error: "No data found" });

        const headers = rows[0];
        const data = rows.slice(1);

        // Log all IDs for debugging
        console.log("Sheet Data IDs:", data.map(row => row[0]));
        console.log("Searching for ID:", req.params.id);

        const rowIndex = data.findIndex(row => row[0].toString().trim() === req.params.id.toString().trim());
        if (rowIndex === -1) return res.status(404).json({ error: "ID not found" });

        const pointsIndex = headers.indexOf("Points");
        if (pointsIndex === -1) return res.status(400).json({ error: "Column 'Points' not found" });

        const votesIndex = headers.indexOf("Votes");
        if (votesIndex === -1) return res.status(400).json({ error: "Column 'Votes' not found" });

        let currentVotes = parseInt(data[rowIndex][votesIndex] || "0", 10);
        currentVotes += 1;

        let currentPoints = parseInt(data[rowIndex][pointsIndex] || "0", 10);
        currentPoints += Number(req.body.score);

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `data!${String.fromCharCode(65 + pointsIndex)}${rowIndex + 2}`,
            valueInputOption: "RAW",
            resource: { values: [[currentPoints]] },
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `data!${String.fromCharCode(65 + votesIndex)}${rowIndex + 2}`,
            valueInputOption: "RAW",
            resource: { values: [[currentVotes]] },
        });

        res.json({ message: `Points incremented for ID ${req.params.id}`, newPoints: currentPoints });
    } catch (error) {
        console.error("Error in /api/sheet/:id:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
