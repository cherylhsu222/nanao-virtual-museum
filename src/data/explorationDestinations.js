const knowledgeGraphUrl = 'https://jtchung2005.github.io/nanao/?mg='
  + encodeURIComponent('人物,政府機關,非營利組織,私人企業,大學,空間,事件,物件,產業,行動/活動,族群,群體,在地學校')
  + '&mr='
  + encodeURIComponent('人地關係,空間關係,人際關係,活動/行動參與,物件關聯,社會關聯,組織關聯,事地關係,產業關聯,政策推動,健康議題關係')
  + '&years=1868-2026';

export const explorationDestinations = [
  {
    id: 'migration',
    title: '遷徙地圖',
    description: '沿著山路，探索舊部落如何移動到今天的聚落。',
    href: 'https://cherylhsu222.github.io/migration-map/',
    region: 'mountain',
    stamp: '山路',
  },
  {
    id: 'knowledge',
    title: '南澳知識圖譜',
    description: '從一個節點出發，看見人、地方、產業與事件之間的連結。',
    href: knowledgeGraphUrl,
    region: 'network',
    stamp: '連結',
  },
  {
    id: 'memory',
    title: '南澳記憶庫',
    description: '沿著照片的位置，讀一段段發生在南澳的生活記憶。',
    href: 'https://cherylhsu222.github.io/memory-map-cowork/',
    region: 'coast',
    stamp: '記憶',
  },
];
