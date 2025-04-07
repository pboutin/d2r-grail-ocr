import sqlite3 from "sqlite3";
import fs from "fs";

if (!fs.existsSync("./database.db")) {
  fs.copyFileSync("./template.db", "./database.db");
}

const database = new sqlite3.Database("./database.db", (err) => {
  if (err) console.error("Database opening error: ", err);
});

export default database;
