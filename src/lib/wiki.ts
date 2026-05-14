import fs from "fs";
import path from "path";

const WIKI_FILE = path.join(process.cwd(), "scripts", "wiki.json");

export interface WikiArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

export function getWikiArticles(): WikiArticle[] {
  try {
    if (!fs.existsSync(WIKI_FILE)) {
      return [];
    }
    const content = fs.readFileSync(WIKI_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Wiki read error:", err);
    return [];
  }
}

export function saveWikiArticles(articles: WikiArticle[]): boolean {
  try {
    const dir = path.dirname(WIKI_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WIKI_FILE, JSON.stringify(articles, null, 2));
    return true;
  } catch (err) {
    console.error("Wiki save error:", err);
    return false;
  }
}
