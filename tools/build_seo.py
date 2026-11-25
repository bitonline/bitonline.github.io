"""Rigenera le parti SEO del sito a partire da videos.json.
Uso: python tools/build_seo.py   (dalla cartella bit-site)

- index.html, tra i marcatori <!-- SEO:... -->:
  * JSONLD   -> dati strutturati (WebSite + CollectionPage + ItemList di VideoObject)
  * EPISODES -> elenco testuale degli episodi (leggibile anche senza JavaScript)
  * TICKER   -> nastro scorrevole con i titoli
- sitemap.xml (pagina principale + immagini delle copertine)
- robots.txt
"""
import html, json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://bitonline.github.io/"
TT = "https://www.tiktok.com/@bit.online"
IG = "https://www.instagram.com/bit.online01/"

videos = json.load(open(os.path.join(ROOT, "videos.json"), encoding="utf-8"))
videos.sort(key=lambda v: -v["n"])


def iso_duration(mmss):
    m, s = (int(x) for x in mmss.split(":"))
    return f"PT{m}M{s}S"


def replace_block(text, name, content):
    pat = re.compile(rf"(<!-- SEO:{name} -->)(.*?)(<!-- /SEO:{name} -->)", re.S)
    assert pat.search(text), f"marcatore SEO:{name} mancante"
    return pat.sub(lambda m: m.group(1) + content + m.group(3), text)


# ---------- JSON-LD ----------
graph = [
    {"@type": "WebSite", "@id": SITE + "#website", "url": SITE, "name": "BIT · Ti spiego internet",
     "inLanguage": "it-IT", "description": "Il robot in giacca e cravatta che ti spiega internet e la tecnologia in video brevi."},
    {"@type": "Person", "@id": SITE + "#bit", "name": "BIT", "url": SITE,
     "description": "Personaggio digitale: un robot in giacca e cravatta che spiega la tecnologia di tutti i giorni.",
     "sameAs": [TT, IG]},
    {"@type": "CollectionPage", "@id": SITE + "#page", "url": SITE, "name": "BIT · Il robot che ti spiega internet e la tecnologia",
     "isPartOf": {"@id": SITE + "#website"}, "about": {"@id": SITE + "#bit"}, "inLanguage": "it-IT",
     "primaryImageOfPage": SITE + "assets/og.jpg",
     "mainEntity": {"@type": "ItemList", "itemListOrder": "https://schema.org/ItemListOrderDescending",
                    "numberOfItems": len(videos), "itemListElement": []}},
]
items = graph[2]["mainEntity"]["itemListElement"]
for i, v in enumerate(videos, 1):
    items.append({"@type": "ListItem", "position": i, "item": {
        "@type": "VideoObject", "name": f"{v['title']} · BIT", "description": v.get("desc", v["title"]),
        "thumbnailUrl": SITE + v["cover"], "uploadDate": v["date"] + "T12:00:00+01:00",
        "duration": iso_duration(v["duration"]), "inLanguage": "it-IT",
        "url": f"{TT}/video/{v['tiktok']}", "embedUrl": f"https://www.tiktok.com/player/v1/{v['tiktok']}",
        "creator": {"@id": SITE + "#bit"},
        "sameAs": [f"https://www.instagram.com/reel/{v['instagram']}/"]}})
jsonld = '\n<script type="application/ld+json">\n' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1) + '\n</script>\n'

# ---------- elenco episodi ----------
rows = []
for v in videos:
    t = html.escape(v["title"]); d = html.escape(v.get("desc", ""))
    date = datetime.date.fromisoformat(v["date"]).strftime("%d/%m/%Y")
    rows.append(
        f'          <li><img src="{v["cover"]}" alt="Copertina: {t}" width="90" height="160" loading="lazy">'
        f'<div><h3>#{v["n"]:02d} · {t}</h3><p>{d}</p><small>{date} · {v["duration"]} · '
        f'<a href="{TT}/video/{v["tiktok"]}" target="_blank" rel="noopener">TikTok</a> · '
        f'<a href="https://www.instagram.com/reel/{v["instagram"]}/" target="_blank" rel="noopener">Instagram</a></small></div></li>')
episodes = '\n        <ol class="ep-list">\n' + "\n".join(rows) + '\n        </ol>\n        '

# ---------- ticker ----------
words = ["SISTEMA ONLINE"] + [v["title"].upper() for v in videos]
ticker = "".join(f"<span>{html.escape(w)}</span>" for w in words) * 2

p = os.path.join(ROOT, "index.html")
s = open(p, encoding="utf-8").read()
s = replace_block(s, "JSONLD", jsonld)
s = replace_block(s, "EPISODES", episodes)
s = replace_block(s, "TICKER", ticker)
open(p, "w", encoding="utf-8").write(s)

# ---------- sitemap + robots ----------
last = max(v["date"] for v in videos)
imgs = "".join(f"\n    <image:image><image:loc>{SITE}{v['cover']}</image:loc></image:image>" for v in videos)
sitemap = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{SITE}</loc>
    <lastmod>{last}</lastmod>
    <image:image><image:loc>{SITE}assets/og.jpg</image:loc></image:image>{imgs}
  </url>
</urlset>
"""
open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(sitemap)
open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}sitemap.xml\n")
print(f"OK: {len(videos)} episodi -> index.html, sitemap.xml, robots.txt")
