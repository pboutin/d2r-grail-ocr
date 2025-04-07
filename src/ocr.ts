import { desktopCapturer } from "electron";
import fs from "fs";
import { Item, ItemType } from "./types";
import items from "./items";
import { createWorker } from "tesseract.js";
import database from "./database";

const TMP_DIR = "./ocr-tmp";
const SCREENSHOT_SIZE = 2000;
const CLEANUP_REGEX = /[ ']/g;

const SEARCH_ITEMS: Array<[Item, RegExp]> = (items as Item[]).map((item) => [
  item,
  new RegExp(
    item.name.replace(CLEANUP_REGEX, "") +
      (item.type === ItemType.RUNE ? "(rune|.{0,5}\\d+)" : ""),
    "i"
  ),
]);

const ocr = async () => {
  console.info("Initiate OCR");
  console.time("OCR");

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { height: SCREENSHOT_SIZE, width: SCREENSHOT_SIZE },
  });

  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }

  fs.mkdirSync(TMP_DIR);

  fs.writeFileSync(`${TMP_DIR}/screenshot.png`, sources[0].thumbnail.toPNG());

  const worker = await createWorker("eng", 1, {
    workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
  });
  const ret = await worker.recognize(`${TMP_DIR}/screenshot.png`);
  await worker.terminate();

  const cleanedText = ret.data.text.replace(CLEANUP_REGEX, "");

  const foundItems: Item[] = [];

  for (const [item, regex] of SEARCH_ITEMS) {
    const match = cleanedText.match(regex);

    if (match) {
      console.log("Found ", item.name, "with match", ...match);
      foundItems.push(item);
    }
  }

  if (foundItems.length === 0) {
    console.log("No matches found");
    console.warn(cleanedText);
  } else if (foundItems.length === 1) {
    database.run(
      "INSERT INTO loots(itemId, itemName, foundAt) VALUES(?, ?, ?)",
      [foundItems[0].id, foundItems[0].name, new Date().toISOString()],
      function (error) {
        if (error) {
          return console.log(error.message);
        }
        console.log("Row was added to the table: ${this.lastID}");
      }
    );
  } else {
    console.log("Ambiguous matches found, skipping database update");
  }

  console.info("\nOCR finished");
  console.timeEnd("OCR");
};

export default ocr;
