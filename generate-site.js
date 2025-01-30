const fs = require("node:fs");
const { marked } = require("marked");
const dotenv = require("dotenv");
const { escape } = require("lodash");
dotenv.config();

const generatePieChart = async (jsonPath, output, title = "Languages") => {
  const data = require(jsonPath);
  const counts = {};
  let total = 0;
  for (const repos of data) {
    const lang = repos.language;
    if (counts[lang]) {
      counts[lang] += repos.repos.length;
    } else {
      counts[lang] = repos.repos.length;
    }
    total += repos.repos.length;
  }
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const chartUrl = `https://quickchart.io/chart?c={type:'pie',data:{labels:${JSON.stringify(labels)}, datasets:[{data: ${JSON.stringify(values)} }] }, options: {plugins: {title: {display:true, text: '${title}', color:'#000000'}}}}`;

  fs.writeFileSync(output, `![${title}](${chartUrl})`);
};
async function generate() {
  await generatePieChart("./data.json", "./chart.md");
  const readmeContent = fs.readFileSync("README.md", "utf8");
  const chart = fs.readFileSync("chart.md", "utf8");
  const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My GitHub Stars</title>
        </head>
        <body>
            <h1>My GitHub Stars</h1>
            <div id="content">
                ${marked(readmeContent)}
                    <br/>
                    ${chart}
        `;

  const data = require("./data.json");
  let html = "";
  for (let i = 0; i < data.length; i++) {
    const repos = data[i];
    html += `<h2>${escape(repos.language)}</h2>`;
    html += `<table>`;
    html += `<thead><tr><th>Name</th><th>Description</th><th>Author</th><th>Stars</th><th>Date</th></tr></thead><tbody>`;
    for (const repo of repos.repos) {
      html += `
                  <tr>
                    <td><a href="${escape(repo.url)}">${escape(repo.name)}</a></td>
                    <td>${escape(repo.description)}</td>
                    <td>${escape(repo.author)}</td>
                    <td>${escape(repo.stars)}</td>
                     <td>${escape(repo.date)}</td>
                  </tr>
                 `;
    }
    html += `</tbody></table>`;
  }

  const finalContent =
    htmlContent +
    html +
    `
        <script>
           fetch("./data.json")
           .catch((err)=> {
                    console.log("There was an error" + err);
                   })
          </script>
       </body>
        </html>
        `;

  fs.writeFileSync("index.html", finalContent);
  fs.copyFileSync("data.json", "./data.json");
}

generate();
