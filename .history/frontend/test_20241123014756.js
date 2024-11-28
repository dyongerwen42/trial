const axios = require('axios');

const payload = {
  cmsType: "kengetallen",
  filter: "",
  startIndex: 160,
  records: 100000,
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
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
  Authorization: "Bearer <your-token-here>",
  Connection: "keep-alive",
  "Content-Type": "application/json",
  Cookie: "ARRAffinity=<value>; ARRAffinitySameSite=<value>; _ga=<value>; ...", // Add full cookies here
  Host: "myrev.nl",
  Origin: "https://myrev.nl",
  Referer: "https://myrev.nl/kengetallen",
  "Rev-React-Client": "1.0",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"'
};

axios
  .post("https://myrev.nl/api/cmscontent/CmsContentIndexScroll", payload, { headers })
  .then((response) => {
    console.log("Response:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
