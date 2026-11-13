import { useEffect } from "react";

/*
 * Типограф: расставляет неразрывные пробелы во всём тексте страницы, чтобы предлоги, союзы и тире
 * не повисали в конце строки. Работает по готовой разметке и следит за изменениями — тексты
 * в компонентах остаются обычными, а правило одно на холст, ленту и кейсы.
 */

const NB = " ";
// короткие слова, которые нельзя отрывать от следующего
const LEAD = "в|во|на|не|ни|но|и|а|с|со|к|ко|о|об|у|из|за|по|до|от|для|при|без|под|над|про|или|что|как|это|то|я|мы|он|её|их";
const RE_LEAD = new RegExp(`(^|[\\s${NB}(«„])(${LEAD}) (?=\\S)`, "giu");
// частицы, которые нельзя отрывать от предыдущего слова
const RE_TAIL = / (же|ли|бы|б)(?=[\s.,!?:;»)]|$)/giu;
const RE_DASH = / ([—–])(?=\s|$)/g;
// число и единица измерения; «№ 5»
const RE_UNIT = /(\d) (?=(мин|ч|км|м|лет|года|год|дн|шт|раз|px|%|₽|XP)(?=[\s.,!?:;»)]|$))/gu;
const RE_NUM = /(№|§) (?=\d)/g;

export function typograph(text: string): string {
  let t = text;
  // предлоги могут идти подряд («и в», «но не») — правило применяется дважды
  for (let i = 0; i < 2; i++) t = t.replace(RE_LEAD, `$1$2${NB}`);
  return t.replace(RE_TAIL, `${NB}$1`).replace(RE_DASH, `${NB}$1`).replace(RE_UNIT, `$1${NB}`).replace(RE_NUM, `$1${NB}`);
}

const SKIP = "script, style, textarea, input, code, svg, canvas, .maplibregl-map, [contenteditable]";

function fix(node: Text) {
  const v = node.nodeValue;
  if (!v || v.length < 3 || !v.includes(" ")) return;
  const t = typograph(v);
  if (t !== v) node.nodeValue = t;
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!root.parentElement?.closest(SKIP)) fix(root as Text);
    return;
  }
  if (!(root instanceof Element) || root.closest(SKIP)) return;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if (node instanceof Element) return node.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = tw.nextNode())) fix(n as Text);
}

export function useTypograph() {
  useEffect(() => {
    walk(document.body);
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") walk(m.target);
        else m.addedNodes.forEach(walk);
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, []);
}
