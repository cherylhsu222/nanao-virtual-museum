import graph from './knowledge-graph.json';

const positions = {
  '物質文化': [[18, 27], [25, 48], [18, 69], [31, 22], [31, 76], [12, 40], [12, 56], [38, 16], [38, 84], [27, 88]],
  '地景與聚落': [[82, 28], [88, 47], [78, 66], [91, 77]],
  '人物': [[50, 15]], '事件': [[66, 15]],
  '組織': [[69, 82], [84, 87], [57, 90], [94, 59], [94, 24]],
};
const typeFor = n => n.meta_group || n.node_Group || '其他';
const groupRank = { '物質文化': 1, '地景與聚落': 2, '人物': 3, '事件': 4, '組織': 5 };
const byGroupIndex = {};
export const knowledgeNodes = [
  { ...graph.core, type: 'core', group: 0, x: 50, y: 48 },
  ...graph.nodes.map(n => {
    const group = groupRank[typeFor(n)] ?? 5;
    const key = typeFor(n); const i = byGroupIndex[key] ?? 0; byGroupIndex[key] = i + 1;
    const [x, y] = positions[key]?.[i] ?? [50 + (i % 3) * 12, 20 + i * 12];
    return { ...n, type: key, group, x, y };
  }),
];

// These people and settlement links are the mushroom-farmer records in
// public/data.json. They are kept as a small, explicit layer so the scene can
// reveal the third ring without loading the entire graph at once.
const addedPlaceNodes = [
  { id: '碧候村', type: '地景與聚落', group: 2, info: '又稱比亞豪部落，位於南澳北溪旁，以泰雅族人為主，擁有豐富自然資源與溫泉。' },
  { id: '南澳村', type: '地景與聚落', group: 2, info: '南澳鄉行政中心所在村，位於大南澳溪下游，也是香菇產銷班活躍的生活場域。' },
  { id: '東岳村', type: '地景與聚落', group: 2, info: '位於南澳鄉最北端，擁有東澳湧泉，是段木香菇的重要栽植與推廣區域之一。' },
];

knowledgeNodes.push(...addedPlaceNodes);

const farmerRecords = [
  {
    id: '王鴻文', place: '金洋村', label: '居住地',
    info: '金洋村菇農，專業生產優質段木香菇，獲得 2025 年南澳鄉段木香菇評鑑競賽冠軍。',
    x: 8, y: 35,
  },
  {
    id: '范守臣', place: '金洋村', label: '菇場經營',
    info: '金洋村資深菇農，提供其林地作為段木香菇生長環境研究場域，曾獲評鑑競賽優等。',
    x: 8, y: 52,
  },
  {
    id: '張黃玉琴', place: '金洋村', label: '居住地',
    info: '金洋村菇農，提供段木香菇樣本供學術研究，曾獲南澳鄉香菇評鑑競賽優等獎項。',
    x: 8, y: 69,
  },
  {
    id: '豊添福', place: '金岳村', label: '居住地',
    info: '金岳村資深菇農，擁有超過 35 年之段木香菇栽培經驗，是部落中堅持傳統農法的代表。',
    x: 91, y: 18,
  },
  {
    id: '鐘文明', place: '金洋村', label: '產銷班成員',
    info: '金洋村菇農，產銷班成員，積極參與地方香菇產業活動，曾獲評鑑競賽優等。',
    x: 31, y: 26,
  },
  {
    id: '林萬輝', place: '碧候村', label: '菇場經營',
    info: '碧候村資深菇農，提供研究場域並指導傳統柴燒熱風乾燥設備的技術與經驗。',
    x: 34, y: 82,
  },
  {
    id: '鄭瀚彥', place: '南澳村', label: '居住地',
    info: '南澳村菇農，參與地方農業競賽，獲得 2025 年南澳鄉段木香菇評鑑競賽季軍。',
    x: 61, y: 92,
  },
  {
    id: '高裕仁', place: '東岳村', label: '居住地',
    info: '東岳村菇農，南澳香菇產銷班第一班班長，擁有超過 25 年段木香菇種植經驗。',
    x: 96, y: 47,
  },
  {
    id: '林桂珍', place: null, label: '品牌關聯',
    info: '段木香菇菇農、谷久牧負責人、林務局退休員工。資料來源目前未標示其所屬聚落。',
    x: 92, y: 79,
  },
];

export const farmerNodes = farmerRecords.map((record, index) => ({
  ...record,
  type: '人物',
  group: 3,
  farmer: true,
  revealIndex: index,
}));

knowledgeNodes.push(...farmerNodes);

// Policy nodes are sourced directly from public/data.json and revealed as the
// next layer after the settlement and farmer scenes.
export const policyIds = ['林下經濟政策發布', '天然林全面禁伐政策'];
const addedPolicyNodes = [
  {
    id: '林下經濟政策發布',
    type: '事件',
    group: 4,
    info: '2019 年農委會正式開放「林下經濟」經營申請，容許在林地內合法栽培段木香菇，開啟產業合法化轉型。',
    start_year: 2019,
    end_year: null,
  },
];
knowledgeNodes.push(...addedPolicyNodes);

// Organization layer: names and descriptions are sourced from public/data.json.
// The curated graph predates two of these nodes, so they are added explicitly.
export const organizationIds = [
  '南澳鄉公所',
  '台灣世界展望會',
  '段木香菇巴萊（Papak Khoni Balay）評鑑競賽',
  '南澳鄉香菇產銷班第一班',
  '農業部農業試驗所',
  '谷久牧',
];
const addedOrganizationNodes = [
  {
    id: '南澳鄉公所', type: '政府機關', group: 5,
    info: '南澳鄉最高行政機關，下設農政等課室，負責編印統計年報並主辦段木香菇評鑑競賽。',
  },
  {
    id: '段木香菇巴萊（Papak Khoni Balay）評鑑競賽', type: '行動/活動', group: 5,
    info: '由南澳鄉公所主辦的年度賽事，旨在建立南澳香菇品牌識別，並獎勵生產與烘乾技術表現優異的菇農。',
  },
];
knowledgeNodes.push(...addedOrganizationNodes);

export const knowledgeEdges = [
  ...graph.links.map(link => ({ ...link, from: link.source, to: link.target })),
  ...addedPlaceNodes.map(place => ({
    source: place.id,
    target: '段木香菇',
    from: place.id,
    to: '段木香菇',
    label: '菇農所在聚落',
    meta_relation: 'spatial',
    info: place.info,
    farmerLayer: true,
  })),
  ...farmerRecords.filter(record => record.place).map(record => ({
    source: record.id,
    target: record.place,
    from: record.id,
    to: record.place,
    label: record.label,
    meta_relation: 'spatial',
    info: record.info,
    farmer: true,
  })),
  ...policyIds.map(id => {
    const policy = knowledgeNodes.find(node => node.id === id);
    return {
      source: id,
      target: '段木香菇',
      from: id,
      to: '段木香菇',
      label: '政策影響',
      meta_relation: 'causal',
      info: policy?.info ?? '',
      policy: true,
    };
  }),
  ...organizationIds.map(id => {
    const organization = knowledgeNodes.find(node => node.id === id);
    const sourceEdge = graph.links.find(edge => (
      (edge.source === id && edge.target === '段木香菇') ||
      (edge.target === id && edge.source === '段木香菇')
    ));
    return {
      source: id,
      target: '段木香菇',
      from: id,
      to: '段木香菇',
      label: sourceEdge?.label ?? '組織關聯',
      meta_relation: sourceEdge?.meta_relation ?? 'other',
      info: sourceEdge?.info ?? organization?.info ?? '',
      organization: true,
    };
  }),
];
export const knowledgeCaptions = [
  '先從一個節點開始。', '一朵香菇，不只是香菇，而是從木材與菌種開始。',
  '它也扎根在不同的聚落與山林空間。', '也有人，把這項技術一代一代延續下來。',
  '產業的變化，也受到政策影響。', '從生產到銷售，還有更多組織參與其中。',
  '當這些節點放在一起，才會看見它背後的整體網絡。', '段木香菇，只是其中一個入口。',
];
