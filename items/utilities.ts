import { ItemRank, ItemType } from "../src/types";
import { writeFile } from "fs/promises";

export const resolveItemType = (input: string): ItemType | null => {
  if (input.includes("Unique")) {
    return ItemType.UNIQUE;
  } else if (input.includes("Set")) {
    return ItemType.SET;
  } else if (input.includes("Rare")) {
    return ItemType.RARE;
  }

  return null;
};

export const resolveItemRank = (input: string): ItemRank | null => {
  if (input.includes("Exceptional")) {
    return ItemRank.EXCEPTIONAL;
  } else if (input.includes("Elite")) {
    return ItemRank.ELITE;
  } else if (input.includes("Normal")) {
    return ItemRank.NORMAL;
  }

  return null;
};

export const downloadItemImage = async (
  relativeImagePath: string,
  doDownload = true
): Promise<string> => {
  const ITEM_IMAGE_BASE_URL =
    "https://diablo2.io/styles/zulu/theme/images/items/";

  const fileName = relativeImagePath.split("/").pop()!;

  if (!doDownload) {
    return fileName;
  }

  const response = await fetch(`${ITEM_IMAGE_BASE_URL}${fileName}`);
  if (!response.body) {
    throw new Error("No response body");
  }

  const blob = await response.blob();
  await writeFile(`./items/images/${fileName}`, blob.stream());

  return fileName;
};
