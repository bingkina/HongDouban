import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "红豆瓣 · 短剧虽短，好戏值得被看见",
  description:
    "发现红果好短剧，记录你的每一次心动。红豆瓣是专注红果真人短剧、漫剧与 AI 剧的独立评分评论社区原型。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
