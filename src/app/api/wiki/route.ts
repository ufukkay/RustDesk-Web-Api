import { NextResponse } from "next/server";
import { getWikiArticles, saveWikiArticles, WikiArticle } from "@/lib/wiki";

export async function GET() {
  return NextResponse.json(getWikiArticles());
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const articles = getWikiArticles();
    
    if (data.id) {
      // Update existing
      const index = articles.findIndex(a => a.id === data.id);
      if (index !== -1) {
        articles[index] = { ...data, updatedAt: new Date().toISOString() };
      } else {
        articles.push({ ...data, updatedAt: new Date().toISOString() });
      }
    } else {
      // Create new
      const newArticle: WikiArticle = {
        ...data,
        id: Math.random().toString(36).substring(2, 9),
        updatedAt: new Date().toISOString()
      };
      articles.push(newArticle);
    }

    if (saveWikiArticles(articles)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    let articles = getWikiArticles();
    articles = articles.filter(a => a.id !== id);
    
    if (saveWikiArticles(articles)) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
