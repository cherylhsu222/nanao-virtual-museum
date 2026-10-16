# 南澳開場 prototype

依使用者附件及核准方向實作：React + Vite / MapLibre / OSM / GSAP ScrollTrigger。僅製作開場六幕，不做遷徙章節。米白紙本、灰綠山林、藍灰海洋；桌面左文右圖、手機上圖下文。真實鄉界建立 inverse mask；每幕 camera、圖層、文字由集中設定驅動。約 5,500 為使用者提供的示意值，不稱為泰雅族人口。

資料採內政部界線經 Taiwan Atlas 轉檔，保留來源與版本。聚落以有來源的代表位置標示，非聚落領域。底圖用 OpenFreeMap 的 OSM 向量圖磚自訂樣式。遠端底圖失敗時明示狀態，保留本地界線。終幕保留 onComplete/onProgress 接口，反向捲動可重設完成狀態。
