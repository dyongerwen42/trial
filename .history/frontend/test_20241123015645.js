const axios = require('axios');
const fs = require('fs');

// Define your payload
const payload = {
  cmsType: "kengetallen",
  filter: "",
  startIndex: 0,
  records: 100000
};

// Define your headers
const headers = {
  Accept: "*/*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8",
  Authorization: "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFFMzc2MUFDNUZFMDhBMkY2NTI4QUNGQzZFNkE4MEY2IiwidHlwIjoiYXQrand0In0.eyJpc3MiOiJodHRwczovL2lkZW50aXR5Lm15cmV2Lm5sIiwibmJmIjoxNzMyMzIwMDU0LCJpYXQiOjE3MzIzMjAwNTQsImV4cCI6MTczMjMyMzY1NCwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSJdLCJhbXIiOlsicHdkIl0sImNsaWVudF9pZCI6InJlYWxlc3RhdGV2YWx1YXRvcmNsaWVudCIsInN1YiI6ImMxYTY2OGFlLWUzY2QtNGEzNS1hMmQ2LTJjOGQyMWQwMWE2OSIsImF1dGhfdGltZSI6MTczMjMxNjUxMiwiaWRwIjoibG9jYWwiLCJyZXZfcm9sZSI6WyJCb3V3Z2VicmVrZW4iLCJPbmRlcmhvdWRzS29zdGVuIiwiS2VubmlzYmFuayIsIkJ1c2luZXNzIl0sImdpdmVuX25hbWUiOiJwaWV0ZXJAa29ydGV3ZWdjby5ubCIsInJldl91c2VyaWQiOiIwMDAwMDEzOC0wMTM4LTAxMzgtMzkxYy0xMzBlMGIwOTA4MDciLCJzaWQiOiI2NjQ1N0M5MTIzOTAyRjJENzhFNEEzRTg5NTg4NzFGMSIsImp0aSI6IjlGMTc5NTJDQkJGREQ3NkZGMzQzMjNEM0E0MzIyNDBFIn0.kg5XSnnRWydBpvBr0fnk4VrLqmun-pj4LQIzo9AnroQKHdlfAE34P4ya-gEU_UH1YmDlVX15dCWqPF4_2a-rlkmJB8PhOK4MseChIUzBXXetB3dlokN8UTWOF2WwyEbgsLCITdTf9q-1Rb0ZC0s5jEyOvMDoIgvMZpOWHP6Japc1ua3VCMXxsy_j3F5ceqTapw0t_IqXt6wolptSGFZGA1DNSlZFAlCAj2KWaADdbH_H6KRyOdJJ34Ddtho-JOgEnF2aPi74LJ6AD9GirB4RgKiRevuVI2eTK7XK5vdRHrgzW3aSBjiMT4Po9o7eE8NltQ5M0rBIe7Gmzb31yxYkIw",
  Connection: "keep-alive",
  "Content-Type": "application/json",
  Cookie: "ARRAffinity=c5a7757e69685973957f147f7f547fda25aa575bf0a4b54c17c0da5eb7f451e6; ARRAffinitySameSite=c5a7757e69685973957f147f7f547fda25aa575bf0a4b54c17c0da5eb7f451e6; _ga=GA1.1.1204323224.1732316429; _hjSessionUser_5190019=eyJpZCI6ImRiZDA4OTllLTRmMWQtNTMzNi1iNzUyLTRmOGMyZmM3MTYzMCIsImNyZWF0ZWQiOjE3MzIzMTY0Mjg5MDcsImV4aXN0aW5nIjp0cnVlfQ==; twk_idm_key=Z1RFPuq-fKx00_rAF8Udl; revCookieConsent=true; _hjSession_5190019=eyJpZCI6ImZjMzQ3YWE1LTllODctNDRjNi04YjU4LWExMzRiMjEyNjIxZiIsImMiOjE3MzIzMTY0Mjg5MDgsInMiOjEsInIiOjEsInNiIjowLCJzciI6MSwic2UiOjAsImZzIjoxLCJzcCI6MH0=; _ga_4WN887XH55=GS1.1.1732320054.2.1.1732322347.0.0.0; TawkConnectionTime=0; twk_uuid_64a3d5c994cf5d49dc61699d=%7B%22uuid%22%3A%221.6Aralz8GJ7bpmx1e6iFg5Mgr6IE2NqEGwCaIlC7Akkm6v4poJ2JX0XbN2DdCAo2PHCKnDVb2QLMHirpRFU7H3ufBpC5TFSodCVUVYE70YcCwHzUm%22%2C%22version%22%3A3%2C%22domain%22%3A%22myrev.nl%22%2C%22ts%22%3A1732322348410%7D",
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

// Make the POST request
axios
  .post("https://myrev.nl/api/cmscontent/CmsContentIndexScroll", payload, { headers })
  .then((response) => {
    // Save the response data to a JSON file
    fs.writeFile('response.json', JSON.stringify(response.data, null, 2), (err) => {
      if (err) {
        console.error("Error saving JSON file:", err);
      } else {
        console.log("Response saved to response.json");
      }
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
