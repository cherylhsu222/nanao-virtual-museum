import taiwanRaw from '../data/taiwan-boundary.geojson?raw';
export const mapStyle = {
  version:8,
  glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources:{
    taiwan:{type:'geojson',data:JSON.parse(taiwanRaw)},
    openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>'},
  },
  layers:[
    {id:'paper-ocean',type:'background',paint:{'background-color':'#dce5e3'}},
    {id:'taiwan-land',type:'fill',source:'taiwan',paint:{'fill-color':'#eeeee5'}},
    {id:'forest',type:'fill',source:'openmaptiles','source-layer':'landcover',filter:['in','class','wood','grass','scrub'],paint:{'fill-color':'#bfcbb9','fill-opacity':.65}},
    {id:'park',type:'fill',source:'openmaptiles','source-layer':'park',paint:{'fill-color':'#c3cdbb','fill-opacity':.25}},
    {id:'residential',type:'fill',source:'openmaptiles','source-layer':'landuse',filter:['==','class','residential'],paint:{'fill-color':'#e7e5dc','fill-opacity':.7}},
    {id:'water',type:'fill',source:'openmaptiles','source-layer':'water',paint:{'fill-color':'#dce5e3'}},
    {id:'waterways',type:'line',source:'openmaptiles','source-layer':'waterway',paint:{'line-color':'#a9c1c1','line-opacity':.8,'line-width':['interpolate',['linear'],['zoom'],6,.3,12,1.5]}},
    {id:'coastline',type:'line',source:'taiwan',paint:{'line-color':'#91a69e','line-width':.8,'line-opacity':.5}},
    {id:'minor-roads',type:'line',source:'openmaptiles','source-layer':'transportation',minzoom:10,filter:['in','class','minor','tertiary','service'],paint:{'line-color':'#d0ccc0','line-opacity':.55,'line-width':.65}},
    {id:'major-roads',type:'line',source:'openmaptiles','source-layer':'transportation',filter:['in','class','motorway','trunk','primary','secondary'],paint:{'line-color':'#b5ac97','line-opacity':.65,'line-width':['interpolate',['linear'],['zoom'],6,.45,12,1.5]}},
    {id:'buildings',type:'fill',source:'openmaptiles','source-layer':'building',minzoom:12,paint:{'fill-color':'#d5d3cb','fill-opacity':.4}},
    {id:'administration',type:'line',source:'openmaptiles','source-layer':'boundary',filter:['==','admin_level',6],paint:{'line-color':'#8f9b8e','line-opacity':.32,'line-width':.7,'line-dasharray':[3,3]}},
  ],
};
