import React, { useState } from 'react';
import { knowledgeNodes, knowledgeEdges, farmerNodes, policyIds, organizationIds } from '../data/knowledgeGraph.js';

export default function KnowledgeGraphOverlay({ graphRef }) {
  const [selected, setSelected] = useState(null);
const materialIds = ['杜英', '青剛櫟', '赤楊', '楓香'];
const placeIds = ['金洋村', '金岳村', '武塔村', '澳花村', '碧候村', '南澳村', '東岳村'];
const placePositions = {
  金洋村: [22, 45], 金岳村: [76, 30], 武塔村: [51, 20], 澳花村: [80, 64],
  碧候村: [22, 76], 南澳村: [53, 82], 東岳村: [90, 46],
};
const placeRevealStart = {
  金洋村: .80, 金岳村: .83, 武塔村: .86, 澳花村: .89,
  碧候村: .92, 南澳村: .95, 東岳村: .98,
};
const peopleIds = farmerNodes.map(person => person.id);
const policyPositions = {
  林下經濟政策發布: [24, 30],
  天然林全面禁伐政策: [76, 24],
};
const policyRevealStart = {
  林下經濟政策發布: .12,
  天然林全面禁伐政策: .56,
};
const organizationPositions = {
  南澳鄉公所: [18, 34],
  台灣世界展望會: [88, 18],
  '段木香菇巴萊（Papak Khoni Balay）評鑑競賽': [50, 10],
  南澳鄉香菇產銷班第一班: [88, 82],
  農業部農業試驗所: [14, 60],
  谷久牧: [68, 88],
};
const organizationRevealStart = Object.fromEntries(organizationIds.map((id, index) => [id, .10 + index * .14]));
const rawSummaryPositionById = Object.fromEntries([
  // Summary scene: an editorial orbit around the core, with loose group
  // arcs instead of a rigid grid.
  ...materialIds.map((id, i) => [id, [[36, 44], [39, 63], [64, 44], [68, 63]][i]]),
  ...placeIds.map((id, i) => [id, [[82, 31], [88, 45], [86, 60], [79, 73], [55, 83], [72, 52], [78, 38]][i]]),
  ...peopleIds.map((id, i) => [id, [[13, 31], [13, 48], [15, 66], [21, 70], [29, 76], [21, 38], [30, 61], [35, 68], [39, 75]][i]]),
  ...policyIds.map((id, i) => [id, [[40, 35], [61, 35]][i]]),
  ...organizationIds.map((id, i) => [id, [[23, 25], [35, 14], [62, 12], [80, 23], [70, 37], [17, 39]][i]]),
]);
const summaryPositionById = Object.fromEntries(Object.entries(rawSummaryPositionById));
const fullGraphUrl = 'https://jtchung2005.github.io/nanao/?mg=' + encodeURIComponent('人物,政府機關,非營利組織,私人企業,大學,空間,事件,物件,產業,行動/活動,族群,群體,在地學校') + '&mr=' + encodeURIComponent('人地關係,空間關係,人際關係,活動/行動參與,物件關聯,社會關聯,組織關聯,事地關係,產業關聯,政策推動,健康議題關係') + '&years=1868-2026';
const peoplePlace = Object.fromEntries(farmerNodes.map(person => [person.id, person.place]));
const peoplePositions = Object.fromEntries(farmerNodes.map(person => [person.id, [person.x, person.y]]));
// People are revealed one at a time only after the whole settlement layer is complete.
// Two reveal beats only: the first half of the farmers enters on the first
// scroll, and the rest enters on the second. This keeps the people layer
// readable without requiring a long sequence of small scrolls.
const peopleRevealStart = Object.fromEntries(farmerNodes.map((person, index) => [person.id, index < Math.ceil(farmerNodes.length / 2) ? .06 : .54]));
const placeDescriptions = {
  金岳村: '南澳鄉行政村，日治時期由舊流興部落（Ryohen）遷村至現址，為金岳部落所在。南澳鄉人口最少的村落，以金岳瀑布聞名，維持著傳統的段木香菇栽培技術。',
  澳花村: '位於南澳鄉最南端，以澳花瀑布著稱，具備豐富民族植物資源與段木香菇種植傳統，擁有澳花瀑布景觀。',
  武塔村: '位於南澳山區大南澳南溪旁，日治與戰後多次遷村，設有北迴鐵路車站，周邊林地是段木香菇的重要生長環境。',
  金洋村: '南澳鄉段木香菇產量最高的村落，自然環境極適合菌絲生長，發展生態旅遊與山林教育。',
};
  const visibleNodes = knowledgeNodes.filter(n => n.type === 'core' || materialIds.includes(n.id) || placeIds.includes(n.id) || peopleIds.includes(n.id) || policyIds.includes(n.id) || organizationIds.includes(n.id)).map((n, i) => ({
    ...n,
    ...(n.type === 'core' ? { x: 50, y: 52 } : placeIds.includes(n.id) ? { x: placePositions[n.id][0], y: placePositions[n.id][1] } : peopleIds.includes(n.id) ? { x: peoplePositions[n.id][0], y: peoplePositions[n.id][1] } : policyIds.includes(n.id) ? { x: policyPositions[n.id][0], y: policyPositions[n.id][1] } : organizationIds.includes(n.id) ? { x: organizationPositions[n.id][0], y: organizationPositions[n.id][1] } : { x: [28, 70, 32, 70][materialIds.indexOf(n.id)], y: [30, 30, 68, 68][materialIds.indexOf(n.id)] }),
    revealStart: n.type === 'core' ? .5 : placeIds.includes(n.id) ? placeRevealStart[n.id] : peopleIds.includes(n.id) ? 1 : policyIds.includes(n.id) ? 1 : organizationIds.includes(n.id) ? 1 : [.60, .64, .68, .72][materialIds.indexOf(n.id)],
    policyRevealStart: policyIds.includes(n.id) ? policyRevealStart[n.id] : undefined,
    organizationRevealStart: organizationIds.includes(n.id) ? organizationRevealStart[n.id] : undefined,
    peopleRevealStart: peopleRevealStart[n.id],
  }));
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const node = id => visibleNodes.find(n => n.id === id);
  const selectedEdge = selected ? knowledgeEdges.find(edge => edge.from === selected || edge.to === selected) : null;
  // Keep this first group ordered around the core so each relation grows out
  // independently instead of forming two straight diagonal continuations.
  const visibleEdges = [...materialIds, ...placeIds, ...policyIds, ...organizationIds]
    .map(id => knowledgeEdges.find(edge => (edge.from === id && edge.to === '段木香菇') || (edge.to === id && edge.from === '段木香菇')))
    .filter(Boolean);
  // The closing scene is an overview, so every visible relationship is
  // intentionally drawn from the single core node. This keeps the visual
  // language consistent and avoids suggesting a new person-to-place route.
  const summaryEdges = visibleNodes
    .filter(item => item.type !== 'core')
    .map(item => ({ from: '段木香菇', to: item.id }));
  const summaryPoint = item => {
    const [x, y] = summaryPositionById[item.id] ?? [item.x, item.y];
    return { x, y };
  };
  return <div ref={graphRef} className="knowledge-graph" aria-label="南澳知識圖譜">
    <svg className="knowledge-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {visibleEdges.map((edge, i) => {
        const a = node(edge.from), b = node(edge.to);
        if (!a || !b) return null;
        const core = a.type === 'core' ? a : b;
        const leaf = a.type === 'core' ? b : a;
        const isPlace = placeIds.includes(leaf.id);
        const isPolicy = policyIds.includes(leaf.id);
        const isOrganization = organizationIds.includes(leaf.id);
        const placeIndex = placeIds.indexOf(leaf.id);
        const policyIndex = policyIds.indexOf(leaf.id);
        const organizationIndex = organizationIds.indexOf(leaf.id);
        const bends = [{ x: -2.4, y: 1.2 }, { x: 2.2, y: -1.4 }, { x: -2.2, y: -1.1 }, { x: 2.6, y: 1.2 }];
        const placeBends = [
          { x: 2.2, y: -1.4 }, { x: 3.2, y: -.4 }, { x: 2.4, y: 1.5 },
          { x: 1.2, y: 2.2 }, { x: -2.2, y: 1.8 }, { x: -1.8, y: 2.8 },
          { x: 2.8, y: .5 },
        ];
        const bend = isPlace ? (placeBends[placeIndex] ?? { x: 0, y: 0 }) : bends[i];
        const policyBends = [{ x: -1.5, y: -1.5 }, { x: 1.6, y: -1.8 }];
        const organizationBends = [{ x: -2, y: 0 }, { x: 2, y: -.8 }, { x: 0, y: -1.5 }, { x: 2.4, y: 1 }, { x: -1.5, y: 1.6 }, { x: .8, y: 2 }];
        const finalBend = isPolicy ? (policyBends[policyIndex] ?? { x: 0, y: 0 }) : isOrganization ? (organizationBends[organizationIndex] ?? { x: 0, y: 0 }) : bend;
        const mx = (core.x + leaf.x) / 2;
        const my = (core.y + leaf.y) / 2;
        const d = `M ${core.x} ${core.y} Q ${mx + finalBend.x} ${my + finalBend.y} ${leaf.x} ${leaf.y}`;
        const edgeClass = isOrganization ? 'edge-organization' : isPolicy ? 'edge-policy' : isPlace ? 'edge-place' : 'edge-material';
        const edgeStart = isOrganization ? organizationRevealStart[leaf.id] : isPolicy ? policyRevealStart[leaf.id] : isPlace ? [.74, .77, .80, .83, .86, .89, .92][placeIndex] : [.54, .58, .62, .66][i];
        return <path key={`${edge.from}-${edge.to}-${i}`} className={edgeClass} pathLength="1" style={{ '--edge-start': edgeStart, '--policy-edge-start': isPolicy ? policyRevealStart[leaf.id] : undefined, '--organization-edge-start': isOrganization ? organizationRevealStart[leaf.id] : undefined }} d={d} />;
      })}
      {summaryEdges.map((edge, i) => {
        const a = node(edge.from), b = node(edge.to);
        if (!a || !b) return null;
        const start = summaryPoint(a), end = summaryPoint(b);
        const isPerson = peopleIds.includes(a.id) || peopleIds.includes(b.id);
        const isPlace = placeIds.includes(a.id) || placeIds.includes(b.id);
        const isPolicy = policyIds.includes(a.id) || policyIds.includes(b.id);
        const isOrganization = organizationIds.includes(a.id) || organizationIds.includes(b.id);
        const edgeClass = isPerson ? 'summary-edge summary-edge-people' : isOrganization ? 'summary-edge summary-edge-organization' : isPolicy ? 'summary-edge summary-edge-policy' : isPlace ? 'summary-edge summary-edge-place' : 'summary-edge summary-edge-material';
        const dx = end.x - start.x, dy = end.y - start.y;
        const length = Math.max(Math.hypot(dx, dy), 1);
        const normalX = -dy / length, normalY = dx / length;
        const curveDirection = i % 2 === 0 ? 1 : -1;
        // Give each relation group its own visual lane so edges do not cut
        // through another node on the way out from the core.
        const curveAmount = isPerson ? 6.5 : isOrganization ? 4.2 : isPolicy ? -3.8 : isPlace ? 2.4 : .8;
        const midX = (start.x + end.x) / 2 + normalX * curveAmount * curveDirection;
        const midY = (start.y + end.y) / 2 + normalY * curveAmount * curveDirection;
        return <path key={`summary-${edge.from}-${edge.to}-${i}`} className={edgeClass} d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`} />;
      })}
      {/* 菇農層改用分散節點呈現；聚落關係保留在資訊卡，不再用線干擾畫面。 */}
    </svg>
    {visibleNodes.map(n => <button key={n.id} type="button" className={`knowledge-node group-${n.group} node-${n.type === 'core' ? 'core' : 'support'}${placeIds.includes(n.id) ? ' node-place' : ''}${peopleIds.includes(n.id) ? ' node-person' : ''}${policyIds.includes(n.id) ? ' node-policy' : ''}${organizationIds.includes(n.id) ? ' node-organization' : ''}${n.id === '金洋村' ? ' node-place-primary' : ''}`} style={{ left: `${n.x}%`, top: `${n.y}%`, '--summary-left': `${summaryPositionById[n.id]?.[0] ?? n.x}%`, '--summary-top': `${summaryPositionById[n.id]?.[1] ?? n.y}%`, '--node-start': n.revealStart, '--people-start': n.peopleRevealStart, '--policy-start': n.policyRevealStart, '--organization-start': n.organizationRevealStart }} onClick={() => setSelected(selected === n.id ? null : n.id)} aria-label={`${n.id}｜${organizationIds.includes(n.id) ? '組織' : policyIds.includes(n.id) ? '政策' : peopleIds.includes(n.id) ? '菇農' : n.type}`}>
      <i /> <span>{n.id}</span><small>{peopleIds.includes(n.id) ? '菇農' : n.type}</small>
    </button>)}
    <div className="graph-intro" aria-live="polite">
      <p className="graph-intro-lead"><span className="graph-intro-line">了解了南澳泰雅族的遷徙與聚落之後，</span><br /><span className="graph-intro-line">接下來，我們從一項貼近生活的產業出發，</span><br /><span className="graph-intro-line">看看南澳的人、地方與生活是如何彼此連結的。</span></p>
      <p className="graph-intro-anchor">其中，最具代表性的產業之一，<br />就是 <strong>段木香菇</strong>。</p>
    </div>
    <div className="graph-layer-label">第一層｜木材</div>
    <div className="graph-place-layer-label">第二層｜聚落</div>
    <div className="graph-people-layer-label">第三層｜菇農</div>
    <div className="graph-policy-layer-label">第四層｜政策</div>
    <div className="graph-organization-layer-label">第五層｜組織</div>
    <p className="graph-people-caption">段木香菇的背後，是一群長年在南澳耕作的人。</p>
    <p className="graph-summary-caption">段木香菇，只是理解南澳的一個入口。<br />在它背後，還有更多人、地方與生活之間的連結。<br />想看更多，可以進入完整的知識圖譜探索。</p>
    <div className="knowledge-caption"><p className="caption-materials">我們先從木材開始。<br />一朵香菇的形成，得先從適合培養的段木談起。</p><p className="caption-places">香菇不只生長在段木上，<br />也扎根在南澳不同聚落的生活裡。</p><p className="caption-people" aria-hidden="true" /><p className="caption-policy">段木香菇的發展，也受到政策環境影響。<br />從森林利用到產業推動，政策也會改變這項產業的條件。</p><p className="caption-organization">從地方政府、民間團體到評鑑與銷售系統，這項產業並不是單獨運作的。</p></div>
    <a className="graph-summary-cta" href={fullGraphUrl} target="_blank" rel="noreferrer"><small>想看更多南澳的關係？</small><span>進入知識圖譜探索 →</span></a>
    <div className="knowledge-card" aria-hidden={!selected}>{selected ? <><button type="button" onClick={() => setSelected(null)} aria-label="關閉節點資訊">×</button><b>{selected}</b><small>{node(selected).type === 'core' ? 'core' : <>{peopleIds.includes(selected) ? '菇農｜' : `${node(selected).type}｜`}{selectedEdge?.label ?? ''}</>}</small>{peopleIds.includes(selected) ? <small>所在聚落｜{peoplePlace[selected]}</small> : null}<p>{placeDescriptions[selected] ?? node(selected).info}</p></> : null}</div>
  </div>;
}
