import { checkedRelease } from "./manifest.mjs";

async function showRelease() {
  const status = document.getElementById("status");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("./update.json", { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("尚未发布");
    const text = await response.text();
    if (new TextEncoder().encode(text).length > 65536) throw new Error("清单过大");
    const manifest = JSON.parse(text);
    const url = checkedRelease(manifest);
    document.getElementById("version").textContent =
      `版本 ${manifest.versionName} · ${(manifest.fileSize / 1048576).toFixed(1)} MB · Android ${manifest.minSdk === 29 ? "10" : `API ${manifest.minSdk}`} 及以上`;
    document.getElementById("notes").textContent = manifest.releaseNotes;
    const button = document.getElementById("download");
    button.href = url.href;
    button.hidden = false;
    document.getElementById("details").hidden = false;
    status.textContent = "点击上方下载按钮开始下载，打开本页不会自动下载。";
  } catch (_) {
    status.textContent = "下载暂未开放或发布信息暂不可用，请稍后再试，或使用下方主站入口。";
  } finally {
    clearTimeout(timeout);
  }
}

showRelease();
