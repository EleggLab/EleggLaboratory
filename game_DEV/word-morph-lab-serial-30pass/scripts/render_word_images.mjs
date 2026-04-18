import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    manifest: "output/jobs/word_jobs.json",
    config: "novelai.config.sample.json",
    skipExisting: false,
    limit: Infinity,
    only: new Set(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--manifest") args.manifest = argv[++index];
    else if (token === "--config") args.config = argv[++index];
    else if (token === "--skip-existing") args.skipExisting = true;
    else if (token === "--limit") args.limit = Number(argv[++index] || Number.POSITIVE_INFINITY);
    else if (token === "--only") {
      const values = String(argv[++index] || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      args.only = new Set(values);
    }
  }

  return args;
}

function loadJson(relativePath) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function ensureDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadJson(args.config);
  const manifest = loadJson(args.manifest);
  const endpoint = config.api?.endpoint;
  const tokenEnv = config.api?.token_env || "NOVELAI_TOKEN";
  const token = process.env[tokenEnv];

  if (!endpoint) throw new Error("Missing api.endpoint in config.");
  if (!token) throw new Error(`Missing environment variable ${tokenEnv}.`);

  const outputDir = path.resolve(projectRoot, config.output?.image_dir || "./assets/generated");
  const overwrite = Boolean(config.output?.overwrite);
  const jobs = (manifest.jobs || [])
    .filter((job) => !args.only.size || args.only.has(String(job.slug || "").toLowerCase()))
    .slice(0, Number.isFinite(args.limit) ? args.limit : undefined);

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    const outputPath = path.resolve(outputDir, `${job.slug}.png`);
    if (fs.existsSync(outputPath) && (args.skipExisting || !overwrite)) {
      console.log(`[skip] ${job.slug} -> ${outputPath}`);
      continue;
    }

    const payload = {
      input: job.prompt,
      model: job.model,
      action: "generate",
      parameters: {
        width: job.width,
        height: job.height,
        steps: job.steps,
        scale: job.scale,
        sampler: job.sampler,
        cfg_rescale: job.cfg_rescale,
        seed: job.seed,
        n_samples: job.n_samples,
        qualityToggle: job.quality_toggle,
        sm: job.sm,
        sm_dyn: job.sm_dyn,
        negative_prompt: job.negative_prompt,
      },
    };

    console.log(`[${index + 1}/${jobs.length}] rendering ${job.slug}`);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json, application/zip, image/png, image/jpeg",
        Origin: "https://novelai.net",
        Referer: "https://novelai.net/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      const text = buffer.toString("utf8");
      console.error(`[error] ${job.slug} -> HTTP ${response.status}\n${text}`);
      continue;
    }

    ensureDir(outputPath);
    const tempResponsePath = path.resolve(projectRoot, "tmp", `${job.slug}.response.bin`);
    ensureDir(tempResponsePath);
    fs.writeFileSync(tempResponsePath, buffer);
    execFileSync("python", ["scripts/extract_image_from_response.py", tempResponsePath, outputPath], {
      cwd: projectRoot,
      stdio: "inherit",
    });
    fs.rmSync(tempResponsePath, { force: true });
    console.log(`[saved] ${outputPath}`);

    // A tiny pause keeps the service happier during long runs.
    await sleep(250);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
