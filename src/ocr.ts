import { desktopCapturer } from "electron";
import fs from "fs";
import sharp from "sharp";
import { Item, ItemType } from "./types";
import items from "./items";
import { createWorker } from "tesseract.js";
import database from "./database";

const TMP_DIR = "./ocr-tmp";
const CLEANUP_REGEX = /[ '-]/g;

const CHARACTER_EQUIVALENCES: Record<string, string[]> = {
  d: ["p"],
  g: ["c"],
};

const SEARCH_ITEMS: Array<[Item, RegExp]> = (items as Item[])
  .filter(({ type }) => type !== ItemType.RUNE) // Temp. disabling since it conflicts too much
  .map((item) => {
    const regexString = item.name
      .replace(CLEANUP_REGEX, "")
      .split("")
      .map((char) =>
        CHARACTER_EQUIVALENCES[char]
          ? `[${char}${CHARACTER_EQUIVALENCES[char].join("")}]`
          : char
      )
      .join("");

    return [item, new RegExp(regexString, "i")];
  });

const CHARSET = (items as Item[]).reduce<Set<string>>((charset, item) => {
  item.name.split("").forEach((char) => charset.add(char));
  return charset;
}, new Set());

export const processOcr = async (): Promise<{
  items: Item[];
  cleanedText: string;
}> => {
  await sharp(`${TMP_DIR}/screenshot.png`)
    .removeAlpha()
    .threshold(190)
    .negate()
    .erode(1)
    .toFile(`${TMP_DIR}/preprocessed.png`);

  const worker = await createWorker("eng", 1, {
    workerPath: "./node_modules/tesseract.js/src/worker-script/node/index.js",
  });

  worker.setParameters({
    tessedit_char_whitelist: Array.from(CHARSET).join(""),
  });

  const ret = await worker.recognize(`${TMP_DIR}/preprocessed.png`);
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

  return {
    items: foundItems,
    cleanedText,
  };
};

export default async () => {
  console.info("\nInitiate OCR");
  console.time("OCR");

  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    // TODO: Finding the user's screen size dynamically
    thumbnailSize: { height: 2160, width: 3840 }, // 4K resolution
  });

  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }

  fs.mkdirSync(TMP_DIR);

  fs.writeFileSync(`${TMP_DIR}/screenshot.png`, sources[0].thumbnail.toPNG());

  const { items, cleanedText } = await processOcr();

  if (items.length === 0) {
    console.log("No matches found");
    console.warn(cleanedText);
  } else if (items.length === 1) {
    database.run(
      "INSERT INTO loots(itemId, itemName, foundAt) VALUES(?, ?, ?)",
      [items[0].id, items[0].name, new Date().toISOString()],
      function (error) {
        if (error) {
          return console.log(error.message);
        }
        console.log(`Row was added to the table: ${this.lastID}`);
      }
    );
  } else {
    console.log("Ambiguous matches found, skipping database update");
  }

  console.info("\nOCR finished");
  console.timeEnd("OCR\n");
};
