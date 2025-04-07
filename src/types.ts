export enum ItemRank {
  NORMAL = "normal",
  EXCEPTIONAL = "exceptional",
  ELITE = "elite",
}

export enum ItemType {
  UNIQUE = "unique",
  SET = "set",
  RARE = "rare",
  RUNE = "rune",
}

export interface Item {
  id: string;
  name: string;
  rank: ItemRank | null;
  type: ItemType | null;
  imagePath: string;
}
