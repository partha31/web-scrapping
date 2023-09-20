const webScrapper = require("./web-scrapper.service");

async function main() {
  console.log('Web-scrapping START');
  webScrapper.webScrapper();
}

main();
