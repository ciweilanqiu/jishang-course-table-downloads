export function checkedRelease(manifest) {
  if (!manifest || Array.isArray(manifest) ||
      manifest.applicationId !== "com.coursetable.app" ||
      manifest.channel !== "release" ||
      !Number.isSafeInteger(manifest.versionCode) || manifest.versionCode <= 0 ||
      !Number.isSafeInteger(manifest.minSdk) || manifest.minSdk < 1 ||
      typeof manifest.versionName !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.versionName) ||
      typeof manifest.releaseNotes !== "string" || !manifest.releaseNotes.trim() ||
      manifest.releaseNotes.length > 4000 ||
      typeof manifest.sha256 !== "string" || !/^[a-f\d]{64}$/i.test(manifest.sha256) ||
      !Number.isSafeInteger(manifest.fileSize) || manifest.fileSize <= 0 ||
      typeof manifest.downloadUrl !== "string") {
    throw new Error("正式发布信息不完整");
  }
  const expected = `https://github.com/ciweilanqiu/jishang-course-table-downloads/releases/download/v${manifest.versionName}-code${manifest.versionCode}/CourseTable-v${manifest.versionName}-code${manifest.versionCode}-release.apk`;
  const url = new URL(manifest.downloadUrl);
  if (url.protocol !== "https:" || url.hostname !== "github.com" ||
      url.username || url.password || url.port || url.search || url.hash ||
      manifest.downloadUrl !== expected) {
    throw new Error("下载地址必须是本仓库对应版本的正式 Release APK");
  }
  return url;
}
