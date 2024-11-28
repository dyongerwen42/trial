const axios = require('axios');
const ExcelJS = require('exceljs');

const fetchData = async (startIndex, records = 20) => {
  const payload = {
    cmsType: "kengetallen",
    filter: "",
    startIndex: startIndex,
    records: records,
    categories: [
      { name: "11 bodemvoorzieningen", value: false },
      { name: "13 vloeren op grondslag", value: false },
      { name: "21 buitenwanden", value: false },
      { name: "22 binnenwanden", value: false },
      { name: "23 vloeren", value: false },
      { name: "24 trappen en hellingen", value: false },
      { name: "27 daken", value: false },
      { name: "28 hoofddraagconstructies", value: false },
      { name: "31 buitenwandopeningen", value: false },
      { name: "32 binnenwandopeningen", value: false },
      { name: "34 balustrades en leuningen", value: false },
      { name: "37 dakopeningen", value: false },
      { name: "41 buitenwandafwerkingen", value: false },
      { name: "42 binnenwandafwerkingen", value: false },
      { name: "43 vloerafwerkingen", value: false },
      { name: "44 trap en hellingafwerkingen", value: false },
      { name: "45 plafondafwerkingen", value: false },
      { name: "47 dakafwerkingen", value: false },
      { name: "51 warmteopwekking", value: false },
      { name: "52 afvoeren", value: false },
      { name: "53 water", value: false },
      { name: "54 gassen", value: false },
      { name: "55 koudeopwekking", value: false },
      { name: "56 warmtedistributie", value: false },
      { name: "57 luchtbehandeling", value: false },
      { name: "58 regeling klimaat en sanitair", value: false },
      { name: "61 centrale elektrotechnische  voorzieningen", value: false },
      { name: "62 krachtstroom", value: false },
      { name: "63 verlichting", value: false },
      { name: "64 communicatie", value: false },
      { name: "65 beveiliging", value: false },
      { name: "66 transport", value: false },
      { name: "73 vaste keukenvoorzieningen", value: false },
      { name: "74 vaste sanitaire voorzieningen", value: false },
      { name: "82 losse gebruikersinventaris", value: false },
      { name: "84 losse sanitaire inventaris", value: false },
      { name: "90 terrein", value: false }
    ]
  };

  const headers = {
    Accept: "*/*",
    "Content-Type": "application/json",
    Authorization: "Bearer YOUR_BEARER_TOKEN", // Replace with your token
    Cookie: "YOUR_COOKIES_HERE", // Replace with your cookies
    Host: "myrev.nl",
    Origin: "https://myrev.nl",
    Referer: "https://myrev.nl/kengetallen",
    "Rev-React-Client": "1.0",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin"
  };

  try {
    const response = await axios.post("https://myrev.nl/api/cmscontent/CmsContentIndexScroll", payload, { headers });
    return response.data.articles;
  } catch (error) {
    console.error(`Error fetching data for startIndex ${startIndex}:`, error.message);
    return {};
  }
};

const main = async () => {
  let startIndex = 0;
  const recordsPerRequest = 20;
  let allArticles = [];
  let hasMoreData = true;

  while (hasMoreData) {
    console.log(`Fetching records starting from index ${startIndex}...`);
    const articles = await fetchData(startIndex, recordsPerRequest);

    if (Object.keys(articles).length > 0) {
      allArticles = allArticles.concat(Object.values(articles));
      startIndex += recordsPerRequest;
    } else {
      hasMoreData = false;
    }
  }

  console.log(`Fetched ${allArticles.length} records in total.`);

  // Prepare data for Excel
  const rows = [["ID", "Title", "Primary Filter", "Meta Description", "CMS Path", "Unit", "Cycle", "Price", "Name", "Remarks", "Is Sustainable"]];

  allArticles.forEach(article => {
    const internalDesc = JSON.parse(article.internalDescription || "{}");
    rows.push([
      article.id,
      article.title,
      article.primaryFilter,
      article.metaDescription,
      article.cmsPath,
      internalDesc.unit || "",
      internalDesc.cycle || "",
      internalDesc.price || "",
      internalDesc.name || "",
      internalDesc.remarks || "",
      internalDesc.isSustainable ? "Yes" : "No"
    ]);
  });

  // Create Excel file
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Articles");

  rows.forEach(row => worksheet.addRow(row));

  const filePath = 'articles_output.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Data saved to ${filePath}`);
};

main();
