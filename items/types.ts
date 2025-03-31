export enum ItemRank {
  NORMAL = "normal",
  EXCEPTIONAL = "exceptional",
  ELITE = "elite",
}

export enum ItemRarity {
  UNIQUE = "unique",
  SET = "set",
  RARE = "rare",
}

export interface Item {
  id: string;
  name: string;
  rank: ItemRank | null;
  rarity: ItemRarity | null;
  imagePath: string;
}
