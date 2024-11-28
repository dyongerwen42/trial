const axios = require('axios');
const fs = require('fs');
const ExcelJS = require('exceljs');

// API request
const payload = {
  cmsType: "kengetallen",
  filter: "",
  startIndex: 0,
  records: 100000
};

const headers = {
  Accept: "*/*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
  Authorization: "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFFMzc2MUFD...", // Replace with full token
  Connection: "keep-alive",
  "Content-Type": "application/json",
  Cookie: "ARRAffinity=c5a7757e69685973957f147f7f547fda25aa...", // Replace with full cookies
  Host: "myrev.nl",
  Origin: "https://myrev.nl",
  Referer: "https://myrev.nl/kengetallen",
  "Rev-React-Client": "1.0",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"'
};

axios
  .post("https://myrev.nl/api/cmscontent/CmsContentIndexScroll", payload, { headers })
  .then((response) => {
    const articles = response.data.articles;

    // Save JSON file
    fs.writeFile('response.json', JSON.stringify(response.data, null, 2), (err) => {
      if (err) {
        console.error("Error saving JSON file:", err);
      } else {
        console.log("Response saved to response.json");
      }
    });

    // Prepare data for Excel
    const rows = [["ID", "Title", "Primary Filter", "Meta Description", "CMS Path", "Unit", "Cycle", "Price", "Name", "Remarks", "Is Sustainable"]];

    for (const key in articles) {
      const article = articles[key];
      const internalDescription = JSON.parse(article.internalDescription || "{}");

      rows.push([
        article.id,
        article.title,
        article.primaryFilter,
        article.metaDescription,
        article.cmsPath,
        internalDescription.unit || "",
        internalDescription.cycle || "",
        internalDescription.price || "",
        internalDescription.name || "",
        internalDescription.remarks || "",
        internalDescription.isSustainable ? "Yes" : "No"
      ]);
    }

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Articles");

    rows.forEach((row) => worksheet.addRow(row));

    workbook.xlsx.writeFile("articles.xlsx").then(() => {
      console.log("Excel file created: articles.xlsx");
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
