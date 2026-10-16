import { scenes, storySettings } from '../config/scenes.js';
export const clamp = (x,min=0,max=1) => Math.min(max,Math.max(min,x));
export const smooth = x => { const t=clamp(x); return t*t*(3-2*t); };
export function sampleScene(progress) {
  const p=clamp(progress);
  if(p>=1){
    const last=scenes[scenes.length-1];
    return {...last,index:scenes.length-1,local:1};
  }
  let index=0;
  for(let i=0;i<scenes.length-1;i++) if(p>=scenes[i].start) index=i;
  const from=scenes[index], to=scenes[index+1];
  const local=clamp((p-from.start)/(to.start-from.start));
  const t=smooth(local/storySettings.transitionFraction);
  const state={index,local,id:from.id,center:from.center.map((v,i)=>v+(to.center[i]-v)*t)};
  for(const key of ['zoom','bearing','pitch','nanaoFillOpacity','nanaoBorderOpacity','outsideMaskOpacity','settlementOpacity','settlementLabelOpacity','ruiyanOpacity','ruiyanHaloOpacity','ruiyanLabelOpacity','yilanOpacity']) state[key]=from[key]+(to[key]-from[key])*t;
  return state;
}
export function settlementAlpha(value,index) { return smooth((value-index*.11)/.25); }
export function textAlpha(index,state) {
  if(index!==state.index) return 0;
  return (index===0?1:smooth(state.local/.18)) * (index===5?1:1-smooth((state.local-.86)/.14));
}
