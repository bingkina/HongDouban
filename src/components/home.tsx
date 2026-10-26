"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  Clapperboard,
  Compass,
  ExternalLink,
  Film,
  Flame,
  Heart,
  Library,
  ListFilter,
  PenLine,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import type { Catalog, Drama, DramaType } from "@/lib/types";
import {
  decodePreferences,
  EMPTY_ENTRY,
  filterCatalog,
  STORAGE_KEY,
  type Entry,
  type Preferences,
} from "@/lib/preferences";

const TYPE_LABELS: Record<DramaType | "all", string> = {
  all: "全部",
  real: "真人短剧",
  comic: "漫剧",
  ai: "AI 剧",
};
const TYPES = ["all", "real", "comic", "ai"] as const;
const NAV = [
  { id: "home", label: "发现", icon: Compass },
  { id: "discover", label: "找剧", icon: Clapperboard },
  { id: "ranking", label: "榜单", icon: TrendingUp },
  { id: "collection", label: "片单", icon: Library },
];

function Brand({ small = false }: { small?: boolean }) {
  return (
    <a
      className={`brand ${small ? "brand-small" : ""}`}
      href="#home"
      aria-label="红豆瓣首页"
    >
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none">
          <path
            d="M25.8 7.5c7.8 6.9 5.5 20.3-4.1 23.3C12.4 33.7 4.8 28.3 5.8 20.2c.7-5.9 5.7-7.4 9.2-6.2 4.2 1.5 7.4-1.1 6-5.3-.7-2.3 2.7-3.1 4.8-1.2Z"
            fill="currentColor"
          />
          <path
            d="M22 6c-1-3.5-5.5-4.1-8.4-2.4C15.4 7 18.3 8 22 6Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span>
        红豆瓣<span className="brand-dot">.</span>
      </span>
    </a>
  );
}

function Poster({
  drama,
  className = "",
  priority = false,
}: {
  drama: Drama;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // A cached/network error can happen before React attaches onError during hydration.
    if (img.current?.complete && img.current.naturalWidth === 0)
      setFailed(true);
  }, [drama.poster]);
  return failed ? (
    <div
      className={`poster-placeholder ${className}`}
      role="img"
      aria-label={`${drama.title}海报暂不可用`}
    >
      <Film size={30} aria-hidden="true" />
      <span>{drama.title}</span>
    </div>
  ) : (
    <img
      ref={img}
      className={className}
      src={drama.poster}
      alt={`${drama.title}官方海报`}
      width={400}
      height={560}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      onError={() => setFailed(true)}
    />
  );
}

function Score({
  drama,
  compact = false,
}: {
  drama: Drama;
  compact?: boolean;
}) {
  return (
    <span
      className={`score ${compact ? "score-compact" : ""}`}
      aria-label={
        drama.platformScore === null
          ? "红果暂无评分"
          : `红果评分 ${drama.platformScore.toFixed(1)} 分`
      }
    >
      <Star size={compact ? 12 : 14} fill="currentColor" aria-hidden="true" />
      {drama.platformScore?.toFixed(1) ?? "暂无"}
      <span>红果评分</span>
    </span>
  );
}

function DramaCard({
  drama,
  entry,
  onPreview,
  onWish,
}: {
  drama: Drama;
  entry?: Entry;
  onPreview: (d: Drama) => void;
  onWish: (d: Drama) => void;
}) {
  return (
    <article className="drama-card">
      <div className="poster-wrap">
        <button
          className="poster-button"
          onClick={() => onPreview(drama)}
          aria-label={`快速预览《${drama.title}》`}
        >
          <Poster drama={drama} />
          <span className="poster-shade" />
          <span className={`type-badge type-${drama.type}`}>
            {TYPE_LABELS[drama.type]}
          </span>
          <span className="episode-badge">
            {drama.episodeLabel || "集数待补充"}
          </span>
          <span className="preview-hint">
            快速预览 <ArrowUpRight size={16} />
          </span>
        </button>
        <button
          className={`save-button ${entry?.status ? "is-saved" : ""}`}
          onClick={() => onWish(drama)}
          aria-label={`${entry?.status ? "取消收藏" : "想看"}《${drama.title}》`}
          aria-pressed={!!entry?.status}
        >
          {entry?.status ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
        </button>
      </div>
      <button className="card-title" onClick={() => onPreview(drama)}>
        {drama.title}
      </button>
      <div className="card-meta">
        <span>{drama.tags.slice(0, 2).join(" · ")}</span>
        <Score drama={drama} compact />
      </div>
      {!!entry?.rating && (
        <span className="personal-score">我的评分 {entry.rating * 2}.0</span>
      )}
    </article>
  );
}

function Preview({
  drama,
  entry,
  onClose,
  onUpdate,
}: {
  drama: Drama;
  entry: Entry;
  onClose: () => void;
  onUpdate: (e: Entry) => boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rating, setRating] = useState(entry.rating);
  const [review, setReview] = useState(entry.review);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  const close = () => {
    if (rating !== entry.rating || review !== entry.review) {
      // Drafts remain local when closing the preview, without publishing anything.
      onUpdate({ ...entry, rating, review: review.trim() });
    }
    onClose();
  };
  return (
    <dialog
      ref={dialog}
      className="preview-dialog"
      aria-labelledby="preview-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-content">
        <button
          autoFocus
          className="icon-button close-dialog"
          aria-label="关闭快速预览"
          onClick={close}
        >
          <X size={22} />
        </button>
        <div className="dialog-top">
          <Poster drama={drama} className="dialog-poster" />
          <div className="dialog-info">
            <span className="eyebrow">HONGDOUBAN · 剧集档案</span>
            <span className={`type-inline type-${drama.type}`}>
              {TYPE_LABELS[drama.type]}
            </span>
            <h2 id="preview-title">{drama.title}</h2>
            <p className="muted">
              {drama.episodeLabel || "集数待补充"} ·{" "}
              {drama.tags.slice(0, 3).join(" / ")}
            </p>
            <Score drama={drama} />
            {drama.cast.length > 0 && (
              <p className="cast">主演：{drama.cast.join(" / ")}</p>
            )}
            <div className="status-buttons">
              <button
                className={entry.status === "wish" ? "selected" : ""}
                aria-pressed={entry.status === "wish"}
                onClick={() =>
                  onUpdate({
                    ...entry,
                    status: entry.status === "wish" ? null : "wish",
                  })
                }
              >
                <Bookmark size={16} />
                想看
              </button>
              <button
                className={entry.status === "watched" ? "selected" : ""}
                aria-pressed={entry.status === "watched"}
                onClick={() =>
                  onUpdate({
                    ...entry,
                    status: entry.status === "watched" ? null : "watched",
                  })
                }
              >
                <Check size={16} />
                已看
              </button>
            </div>
          </div>
        </div>
        <div className="dialog-section">
          <h3>关于这部剧</h3>
          <p>{drama.description || "暂无公开简介，可前往红果查看最新资料。"}</p>
          <a
            className="source-link"
            href={drama.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            去红果查看原始剧集 <ExternalLink size={14} />
          </a>
          <small className="source-date">
            资料快照：{drama.capturedAt.slice(0, 10)} · 红果评分为来源平台评分
          </small>
        </div>
        <form
          className="review-form"
          onSubmit={(e) => {
            e.preventDefault();
            const saved = onUpdate({ ...entry, rating, review: review.trim() });
            setMessage(
              saved
                ? "评分与短评已保存在本机"
                : "存储不可用，评分与短评仅暂存于本次访问",
            );
          }}
        >
          <div className="review-form-heading">
            <h3>留下你的观后感</h3>
            <span>
              <ShieldCheck size={13} />
              仅保存在本机
            </span>
          </div>
          <fieldset className="rating-field">
            <legend>我的评分</legend>
            <div className="rating-options">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} title={`${n * 2}分`}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                  />
                  <Star
                    size={27}
                    fill={n <= rating ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  <span className="sr-only">{n * 2}分</span>
                </label>
              ))}
              <span>
                {rating ? `${rating * 2}.0 分` : "轻点星星，给它打分"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setRating(0)}
                >
                  清除
                </button>
              )}
            </div>
          </fieldset>
          <label className="review-label" htmlFor="review-text">
            我的短评
          </label>
          <textarea
            id="review-text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="是哪个瞬间打动了你？聊聊剧情、角色，或看完的感受…"
          />
          <div className="review-form-footer">
            <span>{review.length} / 500</span>
            <div>
              {(entry.rating > 0 || entry.review) && (
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => {
                    setRating(0);
                    setReview("");
                    const saved = onUpdate({ ...entry, rating: 0, review: "" });
                    setMessage(
                      saved
                        ? "已删除本机评分与短评"
                        : "存储不可用，本次访问已清除，历史记录尚未更新",
                    );
                  }}
                >
                  <Trash2 size={14} />
                  删除记录
                </button>
              )}
              <button type="submit" className="primary-button">
                保存观后感 <Check size={16} />
              </button>
            </div>
          </div>
          <p className="form-message" role="status">
            {message}
          </p>
          <small className="muted">
            关闭时自动保存草稿，不会发布到公共社区。
          </small>
        </form>
      </div>
    </dialog>
  );
}

export default function Home({ catalog }: { catalog: Catalog }) {
  const { items } = catalog;
  const [preferences, setPreferences] = useState<Preferences>({});
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DramaType | "all">("all");
  const [tag, setTag] = useState("全部题材");
  const [hotType, setHotType] = useState<DramaType | "all">("all");
  const [selected, setSelected] = useState<Drama | null>(null);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [collectionTab, setCollectionTab] = useState<
    "all" | "wish" | "watched"
  >("all");
  const hero = items.find((d) => d.title === "枝头春意闹") || items[0];
  const snapshotDate = catalog.capturedAt.slice(0, 10).replaceAll("-", ".");
  const filtered = filterCatalog(items, query, type, tag);
  const availableTags = [
    ...new Set(
      items
        .filter((d) => type === "all" || d.type === type)
        .flatMap((d) => d.tags),
    ),
  ];
  const tags = [
    "全部题材",
    ...[
      "爱情",
      "喜剧",
      "家庭",
      "古装",
      "都市",
      "玄幻",
      "脑洞",
      "剧情",
      "逆袭",
    ].filter((t) => availableTags.includes(t)),
  ];
  const hotItems =
    hotType === "all"
      ? [items[3], items[1], items[0], items[7], items[11], items[9]].filter(
          Boolean,
        )
      : items.filter((d) => d.type === hotType).slice(0, 6);
  const ranking = items
    .filter((d) => d.type === "real" && d.rank !== null)
    .sort((a, b) => a.rank! - b.rank!)
    .slice(0, 5);
  const collection = items.filter(
    (d) =>
      preferences[d.id]?.status &&
      (collectionTab === "all" || preferences[d.id].status === collectionTab),
  );
  const ownReviews = items.filter((d) => preferences[d.id]?.review);

  useEffect(() => {
    try {
      setPreferences(
        decodePreferences(
          localStorage.getItem(STORAGE_KEY),
          items.map((d) => d.id),
        ),
      );
    } catch {
      setStorageError(true);
    }
  }, [items]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveNav(entry.target.id);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    NAV.forEach((nav) => {
      const section = document.getElementById(nav.id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);

  function update(drama: Drama, entry: Entry) {
    const next = { ...preferences, [drama.id]: entry };
    setPreferences(next);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, items: next }),
      );
      setStorageError(false);
      return true;
    } catch {
      setStorageError(true);
      setNotice("浏览器存储不可用，记录暂存于本次访问");
      return false;
    }
  }
  function toggleWish(drama: Drama) {
    const entry = preferences[drama.id] || EMPTY_ENTRY;
    const saved = update(drama, {
      ...entry,
      status: entry.status ? null : "wish",
    });
    if (saved)
      setNotice(entry.status ? "已从片单移除" : "已加入想看 · 仅保存在本机");
  }
  function clearFilters() {
    setQuery("");
    setType("all");
    setTag("全部题材");
  }
  function jumpSearch() {
    document
      .getElementById("discover")
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    document.getElementById("catalog-search")?.focus({ preventScroll: true });
  }
  const preview = (drama: Drama) => setSelected(drama);

  return (
    <>
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <span className="header-divider" />
          <nav className="desktop-nav" aria-label="主要导航">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={activeNav === n.id ? "active" : ""}
                onClick={() => setActiveNav(n.id)}
              >
                {n.id === "collection" ? "我的片单" : n.label}
              </a>
            ))}
          </nav>
          <form
            className="header-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              jumpSearch();
            }}
          >
            <Search size={17} aria-hidden="true" />
            <label className="sr-only" htmlFor="header-query">
              搜索短剧名称
            </label>
            <input
              id="header-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索一部好短剧"
            />
            <button type="submit" aria-label="搜索短剧">
              <ArrowRight size={16} />
            </button>
          </form>
          <button
            className="icon-button mobile-search"
            onClick={jumpSearch}
            aria-label="打开找剧搜索"
          >
            <Search size={22} />
          </button>
          <a className="header-collection" href="#collection">
            <Bookmark size={17} />
            <span>我的片单</span>
          </a>
        </div>
      </header>
      <main id="main-content" className="page-shell">
        <section id="home" className="home-section">
          <div className="intro-line">
            <span>
              好故事，值得被看见
              <span className="intro-dot" />
            </span>
            <span>
              只为红果短剧而来 <ArrowDown size={12} />
            </span>
          </div>
          <div className="hero">
            <div className="hero-art">
              <Poster drama={hero} priority />
              <div className="hero-art-overlay" />
            </div>
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span className="live-dot" />
                编辑精选
                <span className="eyebrow-divider" />
                THE SPOTLIGHT
              </div>
              <h1>
                枝头春意闹<span>一场错嫁，满城春色。</span>
              </h1>
              <p className="hero-description">
                为求一线生机，她带着一场“冲喜”的谎言入京。
                <br className="desktop-break" />
                谁知这段意外的缘分，竟成了心尖上的牵挂。
              </p>
              <div className="hero-meta">
                <Score drama={hero} />
                <span className="meta-separator" />
                <span>{hero.episodeLabel}</span>
                <span className="meta-separator" />
                <span>古风爱情 · 故人重逢</span>
              </div>
              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => preview(hero)}
                >
                  <Clapperboard size={18} />
                  快速预览
                  <ArrowUpRight size={17} />
                </button>
                <button
                  className={`secondary-button ${preferences[hero.id]?.status ? "selected" : ""}`}
                  onClick={() => toggleWish(hero)}
                >
                  {preferences[hero.id]?.status ? (
                    <BookmarkCheck size={18} />
                  ) : (
                    <Bookmark size={18} />
                  )}{" "}
                  {preferences[hero.id]?.status ? "已加入片单" : "加入想看"}
                </button>
              </div>
              <span className="hero-source">真人短剧 · 内容与评分来自红果</span>
            </div>
            <div className="hero-caption">
              <span>
                01 <i>/</i> EDITOR’S PICK
              </span>
              <span>短剧虽短，好戏不散场。</span>
            </div>
          </div>
          <div className="category-strip">
            <div className="category-manifesto">
              <span>
                跟随兴趣，
                <br />
                <strong>遇见下一部好剧。</strong>
              </span>
              <ArrowRight size={22} />
            </div>
            {[
              {
                type: "real" as const,
                icon: Clapperboard,
                line: "人间烟火，百种人生",
                count: 12,
              },
              {
                type: "comic" as const,
                icon: Sparkles,
                line: "天马行空，不止想象",
                count: 6,
              },
              {
                type: "ai" as const,
                icon: WandSparkles,
                line: "让新故事，生而不同",
                count: 6,
              },
            ].map((c) => (
              <a
                href="#discover"
                key={c.type}
                className="category-item"
                onClick={() => {
                  setType(c.type);
                  setTag("全部题材");
                  setQuery("");
                }}
              >
                <span className={`category-icon category-${c.type}`}>
                  <c.icon size={24} />
                </span>
                <span>
                  <strong>
                    {TYPE_LABELS[c.type]} <ArrowUpRight size={13} />
                  </strong>
                  <small>{c.line}</small>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="hot-section" aria-labelledby="hot-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">THE TRENDING</span>
              <h2 id="hot-title">
                正在热播
                <span className="red-dot" />
              </h2>
            </div>
            <div className="heading-right">
              <div className="pill-tabs" aria-label="热播内容类型">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    className={hotType === t ? "active" : ""}
                    aria-pressed={hotType === t}
                    onClick={() => setHotType(t)}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <a className="subtle-link" href="#discover">
                全部剧集 <ArrowRight size={15} />
              </a>
            </div>
          </div>
          <div className="poster-grid hot-grid">
            {hotItems.map((d) => (
              <DramaCard
                key={d.id}
                drama={d}
                entry={preferences[d.id]}
                onPreview={preview}
                onWish={toggleWish}
              />
            ))}
          </div>
          <p className="section-footnote">
            <span className="tiny-dot" /> 红果平台资料快照 · {snapshotDate}{" "}
            <span>每一种喜欢，都值得认真对待。</span>
          </p>
        </section>

        <div className="discovery-layout">
          <section
            id="discover"
            className="discover-section"
            aria-labelledby="discover-title"
          >
            <div className="section-heading">
              <div>
                <span className="section-kicker">FIND YOUR NEXT STORY</span>
                <h2 id="discover-title">发现好剧</h2>
              </div>
              <span className="result-count">
                已收录 <b>24</b> 部红果短剧
              </span>
            </div>
            <div className="discovery-tools">
              <div className="underline-tabs" aria-label="找剧内容类型">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    className={type === t ? "active" : ""}
                    aria-pressed={type === t}
                    onClick={() => {
                      setType(t);
                      setTag("全部题材");
                    }}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              <form
                className="catalog-search"
                role="search"
                onSubmit={(e) => e.preventDefault()}
              >
                <Search size={16} aria-hidden="true" />
                <label className="sr-only" htmlFor="catalog-search">
                  在已收录剧集中搜索
                </label>
                <input
                  id="catalog-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜搜你想看的剧"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="清空搜索"
                    onClick={() => setQuery("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </form>
            </div>
            <div className="genre-filters">
              <ListFilter size={15} aria-hidden="true" />
              {tags.map((t) => (
                <button
                  key={t}
                  className={tag === t ? "active" : ""}
                  aria-pressed={tag === t}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="filter-summary" role="status">
              {type === "all" && tag === "全部题材" && !query
                ? "故事很多，总有一部适合此刻的你。"
                : `找到 ${filtered.length} 部符合条件的短剧`}
              {(type !== "all" || tag !== "全部题材" || query) && (
                <button className="text-button" onClick={clearFilters}>
                  清空筛选 <X size={13} />
                </button>
              )}
            </p>
            {filtered.length > 0 ? (
              <div className="poster-grid discover-grid">
                {filtered.map((d) => (
                  <DramaCard
                    key={d.id}
                    drama={d}
                    entry={preferences[d.id]}
                    onPreview={preview}
                    onWish={toggleWish}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={32} />
                <h3>还没找到这段故事</h3>
                <p>试试其他剧名或题材，当前仅搜索已核验的 24 部剧集。</p>
                <button className="secondary-button" onClick={clearFilters}>
                  清空筛选，重新找剧
                </button>
              </div>
            )}
          </section>

          <aside className="sidebar">
            <section
              id="ranking"
              className="ranking-panel"
              aria-labelledby="ranking-title"
            >
              <div className="ranking-heading">
                <div>
                  <span className="section-kicker">HONGGUO CHART</span>
                  <h2 id="ranking-title">
                    <Flame size={21} className="red-icon" />
                    红果热播榜
                  </h2>
                </div>
                <span className="ranking-tag">真人榜</span>
              </div>
              <p className="ranking-note">依据红果平台综合热度排序</p>
              <ol className="rank-list">
                {ranking.map((d, i) => (
                  <li key={d.id}>
                    <span className={`rank-number ${i < 3 ? "top-three" : ""}`}>
                      {String(d.rank).padStart(2, "0")}
                    </span>
                    <button className="rank-item" onClick={() => preview(d)}>
                      <Poster drama={d} />
                      <span>
                        <strong>{d.title}</strong>
                        <small>{d.tags.slice(0, 2).join(" · ")}</small>
                        <Score drama={d} compact />
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
              <a
                className="rank-source"
                href="https://hongguoduanju.com/rank/hot-real-drama"
                target="_blank"
                rel="noreferrer"
              >
                查看红果完整榜单 <ArrowUpRight size={15} />
              </a>
              <p className="rank-date">快照 {snapshotDate} · 非实时榜单</p>
            </section>
            <div className="editor-note">
              <span className="note-symbol" aria-hidden="true">
                “
              </span>
              <h3>
                短的是时长，
                <br />
                长的是回味。
              </h3>
              <p>
                不替你定义好剧，
                <br />
                只为每一份真实感受留一个位置。
              </p>
              <a href="#reviews">
                聊聊你的观后感 <ArrowRight size={15} />
              </a>
              <span className="note-signature">红豆瓣 · 看见好故事</span>
            </div>
            <div className="source-promise">
              <ShieldCheck size={21} />
              <div>
                <strong>只收录红果内容</strong>
                <p>
                  每部剧都可溯源至红果平台。
                  <br />
                  评分有出处，喜欢有记录。
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section
          id="reviews"
          className="reviews-section"
          aria-labelledby="reviews-title"
        >
          <div className="section-heading">
            <div>
              <span className="section-kicker">BEYOND THE LAST EPISODE</span>
              <h2 id="reviews-title">散场之后，还有话说</h2>
            </div>
            <button
              className="secondary-button small-button"
              onClick={() => preview(hero)}
            >
              <PenLine size={15} />
              写一条短评
            </button>
          </div>
          <div className="reviews-intro">
            <p>聊角色、聊故事，也聊那个被打动的自己。</p>
            <span>以下为界面示例，不计入真实社区评价</span>
          </div>
          <div className="review-grid">
            {[
              {
                drama: items[3],
                name: "一颗红豆",
                initial: "豆",
                color: "rose",
                stars: 5,
                text: "好看的不只是古装和氛围，更是人物从试探到靠近的过程。给认真讲故事的短剧多一点耐心。",
                caption: "比起结局，更喜欢靠近的过程。",
              },
              {
                drama: items[0],
                name: "周末不加班",
                initial: "周",
                color: "olive",
                stars: 4,
                text: "下班后想找一部轻松的剧，把烦恼先放一边。能让人会心一笑的小片刻，也值得被好好记录。",
                caption: "生活已经很忙，快乐可以很简单。",
              },
              {
                drama: items[1],
                name: "晚风来信",
                initial: "晚",
                color: "blue",
                stars: 4,
                text: "看故事的时候，也会想起自己记忆里的人。对我来说，一部剧留下的情绪，比时长更重要。",
                caption: "总有一些重逢，让人想起从前。",
              },
            ].map((r, i) => (
              <article className="review-card" key={r.name}>
                <div className="review-user">
                  <span className={`avatar avatar-${r.color}`}>
                    {r.initial}
                  </span>
                  <div>
                    <strong>{r.name}</strong>
                    <span>示例短评 · 非真实用户</span>
                  </div>
                  <span className="sample-label">示例</span>
                </div>
                <div
                  className="review-stars"
                  aria-label={`示例评分 ${r.stars * 2}分`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      fill={n <= r.stars ? "currentColor" : "none"}
                    />
                  ))}
                  <span>{r.stars * 2}.0</span>
                </div>
                <h3>{r.caption}</h3>
                <p>{r.text}</p>
                <button
                  className="review-drama"
                  onClick={() => preview(r.drama)}
                >
                  <Poster drama={r.drama} />
                  <span>
                    <small>关于这部剧</small>
                    <strong>{r.drama.title}</strong>
                  </span>
                  <ChevronRight size={15} />
                </button>
              </article>
            ))}
          </div>
          {ownReviews.length > 0 && (
            <div className="own-reviews">
              <h3>
                我的短评 <span>仅保存在本机</span>
              </h3>
              {ownReviews.map((d) => (
                <article key={d.id}>
                  <div>
                    <button className="text-button" onClick={() => preview(d)}>
                      《{d.title}》 <PenLine size={13} />
                    </button>
                    {preferences[d.id].rating > 0 && (
                      <span className="personal-score">
                        我的评分 {preferences[d.id].rating * 2}.0
                      </span>
                    )}
                  </div>
                  <p>{preferences[d.id].review}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          id="collection"
          className="collection-section"
          aria-labelledby="collection-title"
        >
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR LITTLE CINEMA</span>
              <h2 id="collection-title">
                我的片单{" "}
                <span className="collection-count">
                  {items.filter((d) => preferences[d.id]?.status).length}
                </span>
              </h2>
            </div>
            <span className="local-note">
              <ShieldCheck size={14} />
              仅保存在本机
            </span>
          </div>
          <div className="pill-tabs collection-tabs" aria-label="我的片单状态">
            {(["all", "wish", "watched"] as const).map((t) => (
              <button
                className={collectionTab === t ? "active" : ""}
                key={t}
                aria-pressed={collectionTab === t}
                onClick={() => setCollectionTab(t)}
              >
                {{ all: "全部片单", wish: "想看", watched: "已看" }[t]}
              </button>
            ))}
          </div>
          {collection.length > 0 ? (
            <div className="poster-grid collection-grid">
              {collection.map((d) => (
                <DramaCard
                  key={d.id}
                  drama={d}
                  entry={preferences[d.id]}
                  onPreview={preview}
                  onWish={toggleWish}
                />
              ))}
            </div>
          ) : (
            <div className="collection-empty">
              <span className="collection-empty-icon">
                <Bookmark size={25} />
              </span>
              <div>
                <h3>
                  {collectionTab === "watched"
                    ? "看完一部，就为它留个位置。"
                    : collectionTab === "wish"
                      ? "下一部想看的好剧，从这里开始。"
                      : "把心动的故事，留给有空的自己。"}
                </h3>
                <p>
                  点亮海报上的收藏，或在预览中标记“已看”，记录你的观剧时光。
                </p>
              </div>
              <a className="subtle-link" href="#discover">
                去发现好剧 <ArrowRight size={16} />
              </a>
            </div>
          )}
          {storageError && (
            <p role="alert" className="storage-warning">
              当前浏览器无法保存数据，记录仅在本次访问中保留。
            </p>
          )}
        </section>

        <div className="closing-line">
          <span className="closing-rule" />
          <Heart size={15} />
          <p>每一部短剧，都值得一次认真的相遇。</p>
          <span className="closing-rule" />
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Brand small />
            <p>短剧虽短，好戏值得被看见。</p>
          </div>
          <div className="footer-info">
            <div>
              <a
                href="https://hongguoduanju.com/"
                target="_blank"
                rel="noreferrer"
              >
                内容来源：红果短剧 <ArrowUpRight size={12} />
              </a>
              <span>资料快照 {snapshotDate}</span>
            </div>
            <p>独立评分社区原型 · 非红果或豆瓣官方网站</p>
            <p>仅收录红果真人短剧、漫剧与 AI 剧；本机观剧记录不上传。</p>
          </div>
        </div>
      </footer>
      <nav className="mobile-nav" aria-label="手机主要导航">
        {NAV.map((n) => (
          <a
            key={n.id}
            className={activeNav === n.id ? "active" : ""}
            href={`#${n.id}`}
            onClick={() => setActiveNav(n.id)}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
      {selected && (
        <Preview
          key={selected.id}
          drama={selected}
          entry={preferences[selected.id] || EMPTY_ENTRY}
          onClose={() => setSelected(null)}
          onUpdate={(entry) => update(selected, entry)}
        />
      )}
    </>
  );
}
