import fs from "fs";

// Load data using ES module
const originalData = JSON.parse(fs.readFileSync("./data.json", "utf8"));

// Aggregate language usage by counting occurrences
const languageCount = {};
originalData.forEach((repo) => {
  if (Array.isArray(repo.languages)) {
    repo.languages.forEach((lang) => {
      const name = lang.language;
      if (name) {
        languageCount[name] = (languageCount[name] || 0) + 1;
      }
    });
  }
});

// Sort and pick top 10 languages
const sortedLanguages = Object.entries(languageCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

const labels = sortedLanguages.map(([lang]) => lang);
const data = sortedLanguages.map(([, count]) => count);

// Create QuickChart URL
const chartConfig = encodeURIComponent(
  JSON.stringify({
    type: "pie",
    data: {
      labels,
      datasets: [{ data }],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Top Languages",
          color: "#000",
        },
      },
    },
  }),
);

const chartUrl = `https://quickchart.io/chart?c=${chartConfig}`;

console.log("Generated Chart URL:", chartUrl);

// Generate README.md content
const readmeContent = `
# Data Visualization

**Last Updated:** ${new Date().toLocaleDateString()}

---

## Introduction
This visualization shows the top languages used across repositories.

## Languages Chart
![Languages](${chartUrl})
`;

// Write to README.md
fs.writeFileSync("README.md", readmeContent);

console.log("README.md has been successfully generated!");
