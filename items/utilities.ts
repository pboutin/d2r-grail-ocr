import { ItemRank, ItemRarity } from "./types";
import { writeFile } from "fs/promises";

export const resolveItemRarity = (input: string): ItemRarity | null => {
  if (input.includes("Unique")) {
    return ItemRarity.UNIQUE;
  } else if (input.includes("Set")) {
    return ItemRarity.SET;
  } else if (input.includes("Rare")) {
    return ItemRarity.RARE;
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
  relativeImagePath: string
): Promise<string> => {
  const ITEM_IMAGE_BASE_URL =
    "https://diablo2.io/styles/zulu/theme/images/items/";

  const fileName = relativeImagePath.split("/").pop()!;

  const response = await fetch(`${ITEM_IMAGE_BASE_URL}${fileName}`);
  if (!response.body) {
    throw new Error("No response body");
  }

  const blob = await response.blob();
  await writeFile(`./items/images/${fileName}`, blob.stream());

  return fileName;
};
