import type { DraftBundle } from "@tong/shared";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toUploadUrl(reference: string): string {
  return `/uploads/${reference.split("/").map(encodeURIComponent).join("/")}`;
}

function renderMarkdownish(text: string): string {
  const lines = text.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    const imageMatch = line.match(/^!\[(.*?)\]\(upload:\/\/(.+?)\)$/);
    if (imageMatch) {
      const caption = imageMatch[1] ?? "";
      const relativePath = imageMatch[2] ?? "";
      closeList();
      html.push(
        `<figure class="preview-image"><img src="${toUploadUrl(relativePath)}" alt="${escapeHtml(
          caption || "image",
        )}" /><figcaption>${escapeHtml(caption)}</figcaption></figure>`,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }

  closeList();
  return html.join("\n");
}

export function buildPreviewHtml(bundle: DraftBundle): string {
  return [
    `<section class="preview-section"><h1>전체 보고</h1>${renderMarkdownish(bundle.overallDraft)}</section>`,
    ...bundle.projectDrafts.map(
      (draft) =>
        `<section class="preview-section"><h1>${escapeHtml(draft.projectName)}</h1>${renderMarkdownish(
          draft.body,
        )}</section>`,
    ),
  ].join("\n");
}

export function uploadPreviewUrl(relativePath: string): string {
  return toUploadUrl(relativePath);
}
