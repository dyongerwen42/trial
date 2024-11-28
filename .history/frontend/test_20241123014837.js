const axios = require('axios');

const payload = {
  cmsType: "kengetallen",
  filter: "",
  startIndex: 160,
  records: 100000
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
