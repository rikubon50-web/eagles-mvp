import type { MetadataRoute } from "next";
import { fetchNewsList, fetchBlogList, fetchPlayers, fetchGamesUpcoming, fetchGamesArchive } from "@/lib/microcms";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eagles-mvp-c8m4.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, blogs, players, upcoming, archive] = await Promise.all([
    fetchNewsList(),
    fetchBlogList(),
    fetchPlayers(),
    fetchGamesUpcoming(),
    fetchGamesArchive(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/news`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/roster`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/games`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/standings`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/support`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/support/community`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/support/corporate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/membership`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const newsPages: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${BASE_URL}/news/${item.id}`,
    lastModified: item.publishedAt,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const blogPages: MetadataRoute.Sitemap = blogs.map((item) => ({
    url: `${BASE_URL}/blog/${item.id}`,
    lastModified: item.publishedAt,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const rosterPages: MetadataRoute.Sitemap = players.map((player) => ({
    url: `${BASE_URL}/roster/${player.id}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const gamePages: MetadataRoute.Sitemap = [...upcoming, ...archive].map((game) => ({
    url: `${BASE_URL}/games/${game.id}`,
    lastModified: game.startAt,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticPages, ...newsPages, ...blogPages, ...rosterPages, ...gamePages];
}
