import fs from "fs";
import { processOcr } from "./src/ocr";

const RESTRICTED_ITEMS: string[] = [];

(async () => {
  const testFiles = fs.readdirSync("./ocr-tests");

  const results: string[] = [];
  let successCount = 0;
  let failureCount = 0;
  let ambiguousCount = 0;
  const runtimes: number[] = [];

  for (const testFile of testFiles) {
    if (!testFile.endsWith(".png")) continue;

    if (
      RESTRICTED_ITEMS.length &&
      !RESTRICTED_ITEMS.includes(testFile.split(".")[0])
    ) {
      console.log(`Skipping ${testFile}...`);
      continue;
    }

    console.log(`Processing ${testFile}...`);

    fs.rmSync("./ocr-tmp/screenshot.png");
    fs.copyFileSync(`./ocr-tests/${testFile}`, "./ocr-tmp/screenshot.png");

    const startTime = Date.now();
    const { items, cleanedText } = await processOcr();
    const endTime = Date.now();

    runtimes.push(endTime - startTime);

    let result = `${testFile}\n${endTime - startTime}ms (${
      (endTime - startTime) / 1000
    }s)\n\n`;

    if (items.length === 0) {
      failureCount++;
      result += `No items found\n\n${cleanedText}`;
    } else if (items.length === 1 && testFile.includes(items[0].id)) {
      successCount++;
      result += `Successfully found ${items[0].name} (${items[0].id})`;
    } else {
      ambiguousCount++;
      result += `Ambiguous results:\n${items
        .map((item) => `${item.name} (${item.id})`)
        .join(", ")}\n\n${cleanedText}`;
    }

    results.push(result);
  }

  const summary = `Success: ${successCount}\nFailure: ${failureCount}\nAmbiguous: ${ambiguousCount}\n\nScore: ${Math.round(
    (successCount / (successCount + failureCount + ambiguousCount)) * 100
  )}%\n\nAverage runtime: ${
    runtimes.reduce((acc, runtime) => acc + runtime, 0) / runtimes.length
  }ms\nMin runtime: ${Math.min(...runtimes)}ms\nMax runtime: ${Math.max(
    ...runtimes
  )}ms`;

  results.push(summary);
  console.log(summary);

  fs.writeFileSync(
    `./ocr-tests/results/${new Date().toISOString()}.txt`,
    results.join(
      "\n\n##############################################################################\n\n"
    )
  );
})();
