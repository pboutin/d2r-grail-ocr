import * as cheerio from "cheerio";
import fs from "fs";

import { Item } from "./types";
import { downloadItemImage, resolveItemRarity } from "./utilities";
import { resolveItemRank } from "./utilities";

const WEBSITE_SECTIONS: Array<{
  uri: string;
  descriptionMustContain?: string;
  descriptionCantContain?: string;
}> = [
  {
    uri: "uniques",
  },
  {
    uri: "sets",
    descriptionCantContain: "Full Set",
  },
  {
    uri: "misc/#filter=Rune",
    descriptionMustContain: "Rune",
  },
];

(async () => {
  const items: Item[] = [];

  for (const section of WEBSITE_SECTIONS) {
    const response = await fetch(`https://diablo2.io/${section.uri}`);
    const page = await response.text();

    const $ = cheerio.load(page);

    const htmlItems = $("div.inner").children("article.element-item");

    for (const htmlItem of htmlItems) {
      const $htmlItem = $(htmlItem);

      const $itemLink = $htmlItem.find("h3.z-sort-name a");

      const name = $itemLink.text();
      const id = $itemLink.attr("href")!.split("/").pop()!.replace(".html", "");
      const description = $htmlItem.find("h4").text();

      if (
        (section.descriptionMustContain &&
          !description.includes(section.descriptionMustContain)) ||
        (section.descriptionCantContain &&
          description.includes(section.descriptionCantContain))
      ) {
        continue;
      }

      const imagePath = await downloadItemImage(
        $htmlItem
          .find("a > div[data-background-image]")
          .data("background-image") as string
      );

      items.push({
        id,
        name,
        rank: resolveItemRank(description),
        rarity: resolveItemRarity(description),
        imagePath,
      });
    }
  }

  fs.writeFileSync("./items.json", JSON.stringify(items, null, 2));

  console.log("Donezo !");
})();
