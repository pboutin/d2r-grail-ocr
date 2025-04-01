import { desktopCapturer } from "electron";
import fs from "fs";
import { createWorker } from "tesseract.js";

const TMP_DIR = "./ocr-tmp";
const SCREENSHOT_SIZE = 2000;

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
  console.log(ret.data.text);
  await worker.terminate();

  console.info("\nOCR finished");
  console.timeEnd("OCR");
};

export default ocr;
