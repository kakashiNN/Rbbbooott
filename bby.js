const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const KNOWLEDGE_FILE = "knowledge.json";
let knowledge = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE));

function botReply(message) {
    const msg = message.toLowerCase();
    if (knowledge[msg]) return knowledge[msg];
    return "Ami ekhono eta jani na! teach: prosno = uttor diye amake sekhao 😊";
}

async function teachBot(question, answer) {
    knowledge[question.toLowerCase()] = answer;
    fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 4));

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    const res1 = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${KNOWLEDGE_FILE}`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const data = await res1.json();
    const sha = data.sha;

    await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${KNOWLEDGE_FILE}`, {
        method: "PUT",
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: `Auto update via teach`,
            content: Buffer.from(JSON.stringify(knowledge, null, 4)).toString("base64"),
            branch: GITHUB_BRANCH,
            sha: sha
        }),
    });
}

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (message.toLowerCase().startsWith("teach:")) {
        const parts = message.replace("teach:", "").split("=");
        if (parts.length === 2) {
            const [q, a] = parts;
            await teachBot(q.trim(), a.trim());
            return res.json({ reply: "🤖 GoatBot: Ami shikhte parlam!" });
        } else {
            return res.json({ reply: "Teach format: teach: prosno = uttor" });
        }
    } else {
        return res.json({ reply: botReply(message) });
    }
});

module.exports = app;
