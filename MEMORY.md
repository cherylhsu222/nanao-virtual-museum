# 南澳虛擬博物館 Memory

## Contacts

無

## Key Decisions

- 知識圖譜各幕統一採用三區版面：左下固定故事旁白、中央 knowledge graph、右上固定 node info card。
- 左下旁白固定在距離左側與底部約 28px～40px，寬度最多約 520px，不跟著節點移動，也不使用卡片底色或厚重陰影。
- 「第五層｜組織」旁白內容預留為：「一朵香菇背後，也有不同的組織與制度一起支撐。」以及「從地方政府、民間團體到產銷與推廣，這項產業並不是單獨運作的。」
- 投稿區接在最後的南澳探索地圖之後，精選故事結尾與探索地圖均提供投稿入口。
- 精選故事回應使用公開留言小卡，所有觀眾都能閱讀；Supabase 專案為 yjjiczyofgbotarelgua，留言獨立存放於 public.story_responses，以 story_id 對應原本 memories 的故事。前端使用公開 publishable key，設定存放於 .env.local。
- 博物館簡易投稿改存獨立的 public.museum_memory_submissions（Table Editor ID：26108），狀態為 pending；訪客僅能新增待審核投稿，不能讀取、修改或刪除投稿。照片沿用 memory-images 儲存空間，年代預設為「年代未提供」。表單送出使用 return=minimal，設定名稱為 VITE_MEMORY_SUBMISSIONS_TABLE，不再使用原本的 memories 表。
