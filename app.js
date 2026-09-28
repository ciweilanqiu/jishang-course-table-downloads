"use strict";

function checkedRelease(manifest) {
  if (manifest.applicationId !== "com.coursetable.app" ||
      !["debug", "release"].includes(manifest.channel) ||
      !Number.isSafeInteger(manifest.versionCode) || manifest.versionCode <= 0 ||
      !Number.isSafeInteger(manifest.minSdk) || manifest.minSdk < 1 ||
      typeof manifest.versionName !== "string" || !manifest.versionName.trim() ||
      typeof manifest.releaseNotes !== "string" || !manifest.releaseNotes.trim() ||
      typeof manifest.sha256 !== "string" || !/^[a-f\d]{64}$/i.test(manifest.sha256)) {
    throw new Error("发布信息不完整");
  }
  const url = new URL(manifest.downloadUrl);
  if (url.protocol !== "https:" || url.hostname !== "github.com" ||
      url.username || url.password || url.search || url.hash || url.port ||
      !/^\/ciweilanqiu\/jishang-course-table-downloads\/releases\/download\/[^/]+\/[^/]+\.apk$/.test(url.pathname)) {
    throw new Error("下载地址不是已确认的版本化 GitHub Release 资产");
  }
  return url;
}

async function showRelease() {
  const status = document.getElementById("status");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("update.json", { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("尚未发布");
    const manifest = await response.json();
    const url = checkedRelease(manifest);
    document.getElementById("version").textContent =
      `版本 ${manifest.versionName}（${manifest.channel === "debug" ? "调试体验版" : "正式版"}）`;
    document.getElementById("notes").textContent = manifest.releaseNotes;
    document.getElementById("sha256").textContent = manifest.sha256.toUpperCase();
    const button = document.getElementById("download");
    button.href = url.href;
    button.hidden = false;
    document.getElementById("details").hidden = false;
    status.textContent = "即将前往 GitHub 下载；如未自动开始，请使用手动下载按钮。";

    const key = `auto-download:${manifest.versionCode}:${manifest.sha256}`;
    let firstVisit = false;
    try {
      firstVisit = sessionStorage.getItem(key) !== "1";
      if (firstVisit) sessionStorage.setItem(key, "1");
    } catch (_) {
      // 禁用站点存储时保留手动按钮，不反复自动跳转。
    }
    if (firstVisit) setTimeout(() => { window.location.assign(url.href); }, 1500);
  } catch (_) {
    status.textContent = "下载暂未开放或发布信息暂不可用，请稍后再试。";
  } finally {
    clearTimeout(timeout);
  }
}

document.addEventListener("DOMContentLoaded", showRelease);
