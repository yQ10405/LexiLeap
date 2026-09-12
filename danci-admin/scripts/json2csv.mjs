import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// 默认输入文件，也可以通过命令行参数指定
const DEFAULT_INPUT = path.join(
  process.cwd(),
  "temp",
  "PEPXiaoXue6_1.json",
);
const inputPath = process.argv[2] || DEFAULT_INPUT;

/**
 * 解析多个顺序拼接的 JSON 对象（非数组），
 * 通过扫描字符串与括号深度切分出每个顶层对象。
 */
function parseConcatenatedJson(text) {
  const objects = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        objects.push(JSON.parse(text.slice(start, i + 1)));
      }
    }
  }
  return objects;
}

/** 按 CSV 规则转义字段 */
function toCsvField(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const raw = readFileSync(inputPath, "utf-8");
const items = parseConcatenatedJson(raw);

const columns = ["wordRank", "headWord", "content", "bookId"];

const lines = [columns.join(",")];
for (const item of items) {
  const row = columns.map((col) => toCsvField(
    col === "content" ? JSON.stringify(item[col]) : item[col],
  ));
  lines.push(row.join(","));
}

const outputPath = inputPath.replace(/\.json$/i, ".csv");
writeFileSync(outputPath, lines.join("\n"), "utf-8");

console.log(`解析到 ${items.length} 条单词记录`);
console.log(`CSV 已保存至: ${outputPath}`);
