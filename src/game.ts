export type Score = { measuredSeconds:number; quietSeconds:number; streak:number; bestStreak:number; noisySeconds:number };
export const emptyScore = ():Score => ({measuredSeconds:0,quietSeconds:0,streak:0,bestStreak:0,noisySeconds:0});
export function tickScore(s:Score, seconds:number, quiet:boolean):Score {
  const dt=Math.max(0,Math.min(seconds,0.5));
  if (!Number.isFinite(dt)) return s;
  const noisySeconds=quiet?0:s.noisySeconds+dt;
  const streak=quiet?s.streak+dt:noisySeconds<=2?s.streak:0;
  return {measuredSeconds:s.measuredSeconds+dt,quietSeconds:s.quietSeconds+(quiet?dt:0),streak,bestStreak:Math.max(s.bestStreak,streak),noisySeconds};
}
export const scoreXP=(s:Pick<Score,'quietSeconds'|'bestStreak'>)=>Math.floor(s.quietSeconds/5)+Math.floor(s.bestStreak/30)*2;
export const soundLevel=(rms:number)=>Math.max(0,Math.min(100,(20*Math.log10(Math.max(rms,0.00001))+70)*100/70));
export const clock=(s:number)=>`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;
export function sessionTiming(measuredSeconds:number,startedAt:number,now:number){
 const wall=Math.max(0,now-startedAt);
 return {autoFinish:measuredSeconds>=7198||wall>=3.9*3600000,expired:wall>=4*3600000};
}
