// Original StudyVille drawings, keyed by the art key the shop API sends.
// offsetY lifts taller drawings so their base sits on the 128x64 tile.

import benchArt from "../../assets/studyville/bench.svg";
import booksArt from "../../assets/studyville/books.svg";
import bookstoreArt from "../../assets/studyville/bookstore.svg";
import coffeeCartArt from "../../assets/studyville/coffee-cart.svg";
import coffeeShopArt from "../../assets/studyville/coffee-shop.svg";
import flowerBushArt from "../../assets/studyville/flower-bush.svg";
import fountainArt from "../../assets/studyville/fountain.svg";
import grassArt from "../../assets/studyville/grass.svg";
import houseArt from "../../assets/studyville/house.svg";
import roadEwArt from "../../assets/studyville/road-ew.svg";
import roadNsArt from "../../assets/studyville/road-ns.svg";
import stoneWallArt from "../../assets/studyville/stone-wall.svg";
import streetLampArt from "../../assets/studyville/street-lamp.svg";
import treeArt from "../../assets/studyville/tree.svg";
import treehouseArt from "../../assets/studyville/treehouse.svg";

export const STUDYVILLE_ART = {
  "bench": { src: benchArt, offsetY: 26 },
  "books": { src: booksArt, offsetY: 32 },
  "bookstore": { src: bookstoreArt, offsetY: 76 },
  "coffee-cart": { src: coffeeCartArt, offsetY: 66 },
  "coffee-shop": { src: coffeeShopArt, offsetY: 76 },
  "flower-bush": { src: flowerBushArt, offsetY: 32 },
  "fountain": { src: fountainArt, offsetY: 56 },
  "grass": { src: grassArt, offsetY: 0 },
  "house": { src: houseArt, offsetY: 86 },
  "road-ew": { src: roadEwArt, offsetY: 0 },
  "road-ns": { src: roadNsArt, offsetY: 0 },
  "stone-wall": { src: stoneWallArt, offsetY: 36 },
  "street-lamp": { src: streetLampArt, offsetY: 86 },
  "tree": { src: treeArt, offsetY: 86 },
  "treehouse": { src: treehouseArt, offsetY: 106 },
};

export function artFor(key) {
  return STUDYVILLE_ART[key] || null;
}
