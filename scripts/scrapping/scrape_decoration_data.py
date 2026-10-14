#!/usr/bin/env python3

from dataclasses import dataclass, asdict
import json

import requests
from bs4 import BeautifulSoup
import logging

@dataclass
class Decoration:
    name: str
    theme: str
    size: str | None = None
    points: int | None = None
    note: str | None = None
    color: str | None = None
    imageUrl: str | None = None

WIKI_URL = "https://cookierun.wiki"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_best_image_url(img):
    srcset = img.get("srcset", "")

    best_url = None
    best_scale = 0.0

    for candidate in srcset.split(","):
        parts = candidate.strip().split()

        if not parts:
            continue

        url = parts[0]
        scale = 1.0

        if len(parts) > 1 and parts[1].endswith("x"):
            try:
                scale = float(parts[1][:-1])
            except ValueError:
                continue

        if scale > best_scale:
            best_scale = scale
            best_url = url

    if best_url:
        return "https:" + best_url if best_url.startswith("//") else best_url

    src = img.get("src")

    if src and src.startswith("//"):
        return "https:" + src

    return src


def scrape_decoration_themes()->dict:
    theme_dict_with_urls = {}
    decoration_page_url = WIKI_URL + "/w/Decorations_(Kingdom)"
    res = requests.get(decoration_page_url)
    logger.info("Request send")
    
    soup = BeautifulSoup(res.content, 'html.parser')

    tables = soup.find_all('div', class_="tablewrapper")

    if tables:
        logger.info("Content found")
        for table in tables:
            for row in table.find_all("tr"):
                theme = row.find("th")

                if theme:
                    link = theme.find("a", title=True)

                    if link:
                        name = link.get("title")
                        url = link.get("href")
                        theme_dict_with_urls[name] = url
    else:
        logger.info("No content found")

    return theme_dict_with_urls

def scrape_decoration_items(theme_name:str, theme_url:str)-> list:
    decorations_list: list[Decoration] = []

    decoration_theme_page_url = WIKI_URL + theme_url
    res = requests.get(decoration_theme_page_url)
    logger.info("Request send")

    soup = BeautifulSoup(res.content, 'html.parser')
    
    logger.info("Page parse")

    decor_cards = soup.find_all('table', class_="wikitable decor-card")

    if decor_cards:
        for card in decor_cards:
            decor_name = card.find("th").get_text(strip=True)

            img = card.find("img")
            image_url = get_best_image_url(img) if img else None

            size_and_points_row = card.find_all("tr")[2]

            size, points = size_and_points_row.find_all("td")

            decorations_list.append(

            Decoration(
                name=decor_name,
                theme=theme_name,
                size=size.get_text(strip=True),
                points=points.get_text(strip=True),
                imageUrl=image_url,
            )
        )
            
    return decorations_list


if __name__ == "__main__":
    decorations_list: list[Decoration] = []

    themes = scrape_decoration_themes()

    for theme_name, theme_page_url in themes.items():
        decorations_list.extend(scrape_decoration_items(
            theme_name=theme_name,
            theme_url=theme_page_url
        ))

    with open("./scripts/data/decorations.json", "w+", encoding="utf-8") as f:
        json.dump([asdict(d) for d in decorations_list], f, indent=4, ensure_ascii=False)
