// scaffold.ts
import { mkdir, open } from "node:fs/promises";
import { join, dirname } from "node:path";

export type LineCallback = (
  line: string,
  ctx: { file: string; lineNumber: number }
) => string;

export type PrologCallback = (
  text: string,
  ctx: { file: string}
) => string;

export type EpilogCallback = (
  text: string,
  ctx: { file: string}
) => string;

export interface ProcessOptions {
  glob: string;
  outputDir?: string;
  doLine: LineCallback;
  epilog?: EpilogCallback;
  prolog?: PrologCallback;
}

const FLUSH_BYTES = 1 << 16;
const GLOB_CHARS = /[*?[\]{}!]/;
import { stat } from "node:fs/promises";
import { dirname, basename, join } from "node:path";

async function splitGlob(
  globPath: string
): Promise<{ baseDir: string; pattern: string; single: boolean }> {
  // 含萬用字元：直接拆
  if (GLOB_CHARS.test(globPath)) {
    const segs = globPath.split("/");
    const baseSegs: string[] = [];
    const patSegs: string[] = [];
    let inPattern = false;
    for (const s of segs) {
      if (!inPattern && !GLOB_CHARS.test(s)) {
        baseSegs.push(s);
      } else {
        inPattern = true;
        patSegs.push(s);
      }
    }
    let baseDir = baseSegs.join("/");
    if (baseDir === "" || baseDir === ".") baseDir = ".";
    else if (baseDir.endsWith(":")) baseDir += "/";
    return {
      baseDir,
      pattern: patSegs.join("/") || "**/*.txt",
      single: false,
    };
  }

  // 不含萬用字元：可能是目錄，也可能是單一檔案
  const trimmed = globPath.replace(/\/+$/, "") || ".";
  try {
    const st = await stat(trimmed);
    if (st.isFile()) {
      return {
        baseDir: dirname(trimmed) || ".",
        pattern: basename(trimmed),
        single: true,
      };
    }
    // 目錄
    return { baseDir: trimmed, pattern: "**/*.txt", single: false };
  } catch {
    // 路徑不存在：當作目錄處理，讓後續 glob 回報無檔案
    return { baseDir: trimmed, pattern: "**/*.txt", single: false };
  }
}

export async function listFiles(globPath: string): Promise<string[]> {
  const { baseDir, pattern, single } = await splitGlob(globPath);
  const files: string[] = [];
  if (single) {
    files.push(pattern); // pattern 即 basename
  } else {
    const glob = new Bun.Glob(pattern);
    for await (const f of glob.scan({ cwd: baseDir, onlyFiles: true })) {
      files.push(join(baseDir, f));
    }
    files.sort();
  }

  return files;
}
export async function processFiles(opts: ProcessOptions): Promise<void> {
  const outputDir = opts.outputDir ?? "out";
  const doLine = opts.doLine;

  const { baseDir, pattern, single } = await splitGlob(opts.glob);
  await mkdir(outputDir, { recursive: true });

  const files: string[] = [];
  if (single) {
    files.push(pattern); // pattern 即 basename
  } else {
    const glob = new Bun.Glob(pattern);
    for await (const f of glob.scan({ cwd: baseDir, onlyFiles: true })) {
      files.push(f);
    }
    files.sort();
  }

  const total = files.length;
  if (total === 0) {
    process.stderr.write(
      `沒有符合 "${pattern}" 的檔案（base: ${baseDir}）\n`
    );
    return;
  }

  let done = 0;
  const startTime = Date.now();

  for (const rel of files) {
    const inPath = join(baseDir, rel);
    const outPath = join(outputDir, rel);
    await mkdir(dirname(outPath), { recursive: true });

    const raw = await Bun.file(inPath).text();
    let normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (opts.prolog) {
      normalized = opts.prolog(normalized, { file: rel });
    }
    const lines = normalized.split("\n");
    if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

    const fh = await open(outPath, "w");
    let buf = "";
    try {
      for (let i = 0; i < lines.length; i++) {
        const out = doLine(lines[i], { file: rel, lineNumber: i + 1 });
        if (out) buf += out;
        if (buf.length >= FLUSH_BYTES) {
          if (opts.epilog) {
            buf = opts.epilog(buf, { file: rel });
          }          
          await fh.write(buf);
          buf = "";
        }
      }
      if (buf) {
        if (opts.epilog) {
          buf = opts.epilog(buf, { file: rel });
        }
        await fh.write(buf);
      }
    } finally {
      await fh.close();
    }

    done++;
    const pct = Math.floor((done / total) * 100);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    process.stderr.write(
      `\r處理進度 ${done}/${total} (${pct}%) 已用時 ${elapsed}s`
    );
  }
  process.stderr.write("\n");
}