# 🧠 Architecture Advisor

**Architecture Advisor** is an interactive tool that helps engineering managers and tech leads reason through high-level architectural choices.  
It guides you through a short questionnaire about your **team size, traffic profile, reliability needs, and ops maturity**, then recommends the most appropriate architecture pattern — such as a well-structured monolith, modular monolith, microservices, or serverless model — with transparent scoring, trade-offs, and “tipping points” for when to evolve further.

---

## 🚀 What it does

- Presents a lightweight, web-based **questionnaire** for capturing team and system context  
- Generates a **recommendation** with:
  - Primary architecture type  
  - Confidence score and scoring breakdown  
  - Rationale for each factor  
  - Trade-offs to accept  
  - “What would change the recommendation?” section (tipping points)
- Persists answers in `localStorage` so you can refresh without losing data
- Includes **tooltips** for common architectural terms (RPS, SLO, p95, consistency, etc.)
- Uses plain React + TypeScript, no external backend

---

## 🧩 Tech stack

| Layer | Technology |
|-------|-------------|
| Frontend | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| State & persistence | React hooks + localStorage |
| Scoring logic | `rules.ts` (custom heuristic model) |

---

## ⚙️ Setup & run locally

1. **Clone the repo**
   ```bash
   git clone https://github.com/<your-username>/architecture-advisor.git
   cd architecture-advisor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   The app will start on [http://localhost:5173](http://localhost:5173) by default.

4. **Open in browser**
   You’ll see the questionnaire form; adjust answers to see how the recommendation changes in real time.

---

## 🧠 How it works (conceptually)

The `rules.ts` file defines a simple scoring model:
- Each question contributes positive or negative weights toward different architecture options.
- Explanations are generated per answer, describing *why* that factor matters.
- The difference between top two scores becomes a confidence level.
- Trade-offs and tipping points are derived from the final recommendation.

This makes architectural reasoning **transparent and explainable** rather than “black-box.”

---

## 🪜 Roadmap

- [ ] Add visual charts for score breakdowns (e.g., radar or bar chart)  
- [ ] Export/share recommendations (PDF or Markdown summary)  
- [ ] Add glossary modal with full architectural definitions  

---

## 🧰 Environment variables (optional)

None are required for local use.  
If you deploy, you can set a build variable like:
```
VITE_APP_TITLE="Architecture Advisor"
```

---

## 🧑‍💻 Contributing

Pull requests welcome!  
If you’d like to tweak the scoring logic:
- Edit `rules.ts` to adjust weights, rationale text, or trade-offs.
- Test by running `npm run dev` and changing answers in the UI.

