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
  const sections = [
    `<section class="preview-section"><header><h1>전체 보고</h1></header>${renderMarkdownish(bundle.overallDraft)}</section>`,
    ...bundle.projectDrafts.map(
      (projectDraft) =>
        `<section class="preview-section"><header><h1>${escapeHtml(
          projectDraft.projectName,
        )}</h1></header>${renderMarkdownish(projectDraft.body)}</section>`,
    ),
  ];
  return sections.join("\n");
}

export function extractUploadRefs(text: string): string[] {
  const refs = new Set<string>();
  const regex = /!\[[^\]]*?\]\(upload:\/\/(.+?)\)/g;
  let match = regex.exec(text);
  while (match) {
    if (match[1]) {
      refs.add(match[1]);
    }
    match = regex.exec(text);
  }
  return [...refs];
}

export async function markdownishToNotionBlocks(
  text: string,
  resolveFileUploadId: (relativePath: string, caption: string) => Promise<string>,
): Promise<Record<string, unknown>[]> {
  const blocks: Record<string, unknown>[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const imageMatch = line.match(/^!\[(.*?)\]\(upload:\/\/(.+?)\)$/);
    if (imageMatch) {
      const caption = imageMatch[1] ?? "";
      const relativePath = imageMatch[2] ?? "";
      blocks.push({
        object: "block",
        type: "image",
        image: {
          type: "file_upload",
          caption: caption ? [{ type: "text", text: { content: caption } }] : [],
          file_upload: { id: await resolveFileUploadId(relativePath, caption || "image") },
        },
      });
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ object: "block", type: "heading_3", heading_3: { rich_text: [{ type: "text", text: { content: line.slice(4) } }] } });
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ object: "block", type: "heading_2", heading_2: { rich_text: [{ type: "text", text: { content: line.slice(3) } }] } });
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ object: "block", type: "heading_1", heading_1: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] } });
      continue;
    }
    if (line.startsWith("- ")) {
      blocks.push({ object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ type: "text", text: { content: line.slice(2) } }] } });
      continue;
    }

    blocks.push({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: line } }] } });
  }
  return blocks;
}
