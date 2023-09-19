const fs = require("fs");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const constants = require("./constants");

var totalAds = 0;
var browser;
var page;
async function main() {
  try {
    const initialUrl = constants.initialUrl;
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto(initialUrl);
    const html = await page.content();
    let $ = cheerio.load(html);
    const pageCount = getTotalPageCount($);
    var itemsList = [];
    for (var pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      var url = "";
      if (pageNumber == 1) {
        url = initialUrl;
      } else {
        url = getNextPageUrl(pageNumber, initialUrl);
      }
      $ = await getAdListPageContent(url, page);
      addItems($, itemsList);
    }
    await scrapeTruckItem(itemsList);
    console.log(getTotalAdCount());
  } catch (err) {
    console.log("error occured", err);
  }
}
function getTotalAdCount() {
  return totalAds;
}
function getTotalPageCount($) {
  const paginationElements = $(".e1f09v7o0");
  const pageCount = $(paginationElements[paginationElements.length - 1])
    .children("span")
    .text();
  return pageCount;
}
async function scrapeTruckItem(itemList) {
  for (const item of itemList) {
    await page.goto(item.url);
    const html = await page.content();
    const $ = cheerio.load(html);
    const truckItem = {
      title: $(".offer-summary .offer-title").text().trim(),
      itemId: item.id,
      price: `${$(".offer-price").first().attr("data-price").trim()} ${$(
        ".offer-price__currency"
      )
        .first()
        .text()
        .trim()}`,
    };
    const labelList = $(".offer-params__item .offer-params__label");
    const valueList = $(".offer-params__item .offer-params__value");
    let index = 0;
    for (const label of labelList) {
      const labelText = $(label).text().trim();
      const valueText = $(valueList[index]).text().trim();
      if (labelText == constants.power) {
        truckItem["power"] = valueText;
      }
      if (labelText == constants.milage) {
        truckItem["mileage"] = valueText;
      }
      if (labelText == constants.registrationDate) {
        truckItem["registrationDate"] = valueText;
      }
      if (labelText == constants.productionDate) {
        truckItem["productionDate"] = valueText;
      }
      index++;
    }
    fs.appendFileSync("./truck-items.txt", `\n ${JSON.stringify(truckItem)}`);
  }
}
function addItems($, itemsList) {
  var adListContent = $(".ev7e6t89");
  var adListContentForId = $(".ev7e6t818");
  totalAds += adListContent.length;
  var index = 0;
  for (const el of adListContent) {
    var item = {
      url: $(el).children("a").attr("href"),
      id: $(adListContentForId[index]).attr("data-id"),
    };
    itemsList.push(item);
    index++;
  }
}
async function getAdListPageContent(url, page) {
  await page.goto(url);
  const html = await page.content();
  const $ = cheerio.load(html);
  return $;
}
function getNextPageUrl(pageNumber, initialUrl) {
  return `${initialUrl}&page=${pageNumber}`;
}
main();