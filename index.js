import fs from "fs";
import { Command } from "commander";
import puppeteer from "puppeteer";
import http from "http";
import inquirer from "inquirer";

import helpers from "./scrapers/helpers.js";
import scrapers from "./scrapers/index.js";

async function getCourseTitle(page) {
  try {
    // Wait for the breadcrumb element to be present
    await page.waitForSelector('li[id^="crumb_course_"] span.ellipsible', { timeout: 5000 });

    // Extract the course title text
    const courseTitle = await page.evaluate(() => {
      const element = document.querySelector('li[id^="crumb_course_"] span.ellipsible');
      return element ? element.textContent.trim() : null;
    });

    return courseTitle;
  } catch (error) {
    helpers.print("ERROR", "COURSE_TITLE", "Could not extract course title", 0, error);
    return null;
  }
}

function parseUrl(url) {
  const regex = /^https:\/\/([^/]+)\/courses\/([^/]+)(\/.*)?$/;
  const match = url.match(regex);
  if (!match) {
    helpers.print(
      "ERROR",
      "URL",
      "Invalid URL. Please follow the 'https://<school_domain>/courses/<course_id>' format. Exiting...",
      0
    );
    process.exit(1);
  }

  return `https://${match[1]}/courses/${match[2]}`;
}

function readCookies(path) {
  try {
    return JSON.parse(fs.readFileSync(path));
  } catch (e) {
    helpers.print(
      "ERROR",
      "COOKIES",
      "Could not read cookies. Exiting...",
      0,
      e
    );
    process.exit(1);
  }
}

const argDef = [
  {
    type: "input",
    name: "[url]",
    message:
      "Please enter the Course Homepage URL (e.g. https://<school_domain>/courses/<course_id>):",
    validate: (input) =>
      /^https:\/\/[^/]+\/courses\/[^/]+$/.test(input) ||
      "Invalid URL format. The URL should match the pattern https://<school_domain>/courses/<course_id>",
    description:
      "Course Homepage URL (e.g. https://<school_domain>/courses/<course_id>)",
  },
];

const flagDef = [
  {
    type: "input",
    name: "output",
    message: "Please enter the output directory name:",
    default: "courses/course",
    flags: "-o, --output <dir_name>",
    description: "output directory name",
  },
  {
    type: "input",
    name: "cookies",
    message: "Please enter the path to the cookies file:",
    default: "cookies.json",
    flags: "-c, --cookies <path>",
    description: "path to cookies file",
    onlyShowValid: true,
    validate: (input) => {
      if (!fs.existsSync(input))
        return "File does not exist. Please enter a valid path.";
      if (!input.toLowerCase().endsWith("json"))
        return "Invalid file format. Please enter a path to a JSON file.";
      return true;
    },
  },
  {
    type: "confirm",
    name: "a",
    message: "Do you want to scrape assignments?",
    default: true,
    flags: "-a",
    description: "scrape assignments",
  },
  {
    type: "confirm",
    name: "m",
    message: "Do you want to scrape modules?",
    default: true,
    flags: "-m",
    description: "scrape modules",
  },
];

const program = new Command();
program
  .name("Canvas Scraper CLI")
  .description(
    "A NodeJS command-line interface for scraping and downloading data (e.g. assignments and modules) from a Canvas course."
  );

argDef.forEach((arg) => program.argument(arg.name, arg.description));

flagDef.forEach((flag) =>
  program.option(flag.flags, flag.description, flag.default)
);

program.action(async (url, options) => {
  if (!url) {
    helpers.print("NOTE", "URL", "No URL provided. Entering wizard...");
    const answers = await inquirer.prompt(argDef.concat(flagDef));

    url = answers.url;
    Object.assign(options, answers);
  }

  // url parsing
  url = parseUrl(url);
  // read cookies
  const cookies = readCookies(options.cookies);

  console.log(`*** SCRAPING COURSE FROM ${url} ***`);
  console.log(`FLAGS: ${JSON.stringify(options)}`);

  // scrape course
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await helpers.newPage(browser, cookies, url);
  if (page.status !== 200) {
    helpers.print(
      "ERROR",
      "HOMEPAGE",
      "Could not load homepage. Exiting...",
      0,
      http.STATUS_CODES[page.status]
    );
    process.exit(1);
  }

  // Get course title first
  const courseTitle = await getCourseTitle(page);
  let dir = options.output;

  if (courseTitle) {
    console.log(`Found course: ${courseTitle}`);
    console.log(`*** SCRAPING COURSE: ${courseTitle} ***`);

    // Create safe directory name from course title
    const safeCourseTitle = courseTitle
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length

    dir = `${dir}/${safeCourseTitle}`;
  } else {
    // Fallback to course ID if title not found
    const courseIdMatch = url.match(/\/courses\/([^/]+)/);
    const courseId = courseIdMatch ? courseIdMatch[1] : 'unknown';

    console.log(`Could not find course title, using course ID: ${courseId}`);
    console.log(`*** SCRAPING COURSE: ${courseId} ***`);

    dir = `courses/${courseId}`;
  }

  // create output directory
  if (fs.existsSync(dir)) fs.rmSync(dir, { directory: true, recursive: true });
  fs.mkdirSync(dir, { recursive: true });

  await page.pdf({ path: `${dir}/.HOMEPAGE.pdf`, format: "Letter" });
  page.close();

  const toScrape = { a: options.a, m: options.m };
  if (Object.values(toScrape).every((v) => !v)) {
    helpers.print("NOTE", "FLAGS", "No flags set. Scraping all...", 0);
    for (const key in toScrape) toScrape[key] = true;
  }
  if (toScrape.a) await scrapers.scrapeAssignments(browser, cookies, url, dir);
  if (toScrape.m) await scrapers.scrapeModules(browser, cookies, url, dir);

  browser.close();
  console.log(`*** FINISHED SCRAPING ${url} ***`);
});

program.parse();
