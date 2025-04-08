import sharp from "sharp";

(async () => {
  await sharp("./ocr-tmp/screenshot.png")
    .removeAlpha()
    .threshold(190)
    .negate()
    .erode(1)
    .toFile("./ocr-tmp/preprocessed.png");
})();
