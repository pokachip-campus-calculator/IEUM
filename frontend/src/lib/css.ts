import type { CSSProperties } from "react";

/** 아무 일도 하지 않는 핸들러 (값만 보여 주는 읽기 전용 input 용) */
export const noop = () => {};

function splitDecls(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = "";
  let cur = "";
  for (const c of s) {
    if (quote) {
      cur += c;
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === ";" && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

function propName(p: string): string {
  p = p.trim();
  if (p.startsWith("--")) return p; // CSS 변수
  if (p.startsWith("-ms-")) return "ms" + camel(p.slice(3));
  if (p.startsWith("-")) return camel(p.slice(1)).replace(/^./, (c) => c.toUpperCase()); // -webkit-… → Webkit…
  return camel(p);
}

/**
 * 동적으로 만들어진 style 문자열("width:10px;--d:1")을 React style 객체로 바꿉니다.
 * (정적인 style 은 변환 시점에 객체로 바뀌어 있고, {{값}}이 섞인 style 만 이 함수를 지나갑니다.)
 */
export function css(input: string | CSSProperties | null | undefined): CSSProperties {
  if (!input) return {};
  if (typeof input !== "string") return input;
  const style: Record<string, string> = {};
  for (const decl of splitDecls(input)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const name = propName(decl.slice(0, i));
    const value = decl.slice(i + 1).trim();
    if (name) style[name] = value;
  }
  return style as CSSProperties;
}
