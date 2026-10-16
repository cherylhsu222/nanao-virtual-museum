# 南澳開場 Implementation Plan

**Goal:** 可預覽且能反向捲動的六幕地圖。
**Spec:** docs/design.md 與使用者原始附件。
**Architecture:** 單一 MapLibre instance；單一 GSAP progress proxy；純函式取樣 scene；DOM refs 更新文字；圖層初始化一次。

1. 資料與底圖：下載來源、轉 GeoJSON、記錄授權；檢查南澳及宜蘭屬性與所有聚落座標。
2. 動畫：先測試 scene 端點、反向取樣、依序節點與 inverse mask 排除南澳，再實作 sampleScene / createOutsideMask。
3. 畫面：NanaoScrollyMap、ScrollyText、responsive CSS、進度與來源說明；完成 callback 可反向重設。
4. 驗證：npm test、npm run build；瀏覽器桌面及手機檢查首幕、中段、末幕、倒捲、快速捲動與載入狀態，最後開啟預覽。

**Review focus:** 外部圖磚失敗、窄螢幕文字遮住點位、快速捲動、重整停在中段、元件 cleanup 與 resize。
