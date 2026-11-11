import {describe,it,expect} from 'vitest';
import {emptyScore,tickScore,scoreXP,soundLevel,sessionTiming} from '../src/game';
describe('classroom scoring',()=>{
 it('counts elapsed time instead of frames',()=>{let a=emptyScore(),b=emptyScore();for(let i=0;i<100;i++)a=tickScore(a,.1,true);for(let i=0;i<20;i++)b=tickScore(b,.5,true);expect(a.quietSeconds).toBeCloseTo(b.quietSeconds);});
 it('gives noise no quiet credit, protects streak for two seconds, then resets',()=>{let s={...emptyScore(),streak:12,bestStreak:12};for(let i=0;i<4;i++)s=tickScore(s,.5,false);expect(s.streak).toBe(12);expect(s.quietSeconds).toBe(0);s=tickScore(s,.1,false);expect(s.streak).toBe(0);expect(s.bestStreak).toBe(12);});
 it('never credits a suspended tab gap or invalid elapsed time',()=>{expect(tickScore(emptyScore(),100,true).quietSeconds).toBe(.5);expect(tickScore(emptyScore(),NaN,true)).toEqual(emptyScore());});
 it('retains earned XP after a noisy interruption',()=>{let s={...emptyScore(),quietSeconds:60,bestStreak:60};let xp=scoreXP(s);for(let i=0;i<20;i++)s=tickScore(s,.5,false);expect(scoreXP(s)).toBe(xp);});
 it('normalizes silence and loud input safely',()=>{expect(soundLevel(0)).toBe(0);expect(soundLevel(1)).toBe(100);});
});

describe('session limits',()=>{
 it('ends before the two-hour measured cap',()=>{expect(sessionTiming(7197,0,100).autoFinish).toBe(false);expect(sessionTiming(7198,0,100).autoFinish).toBe(true);});
 it('counts pauses toward wall expiry and attempts finish before expiry',()=>{expect(sessionTiming(0,0,3.9*3600000)).toEqual({autoFinish:true,expired:false});expect(sessionTiming(0,0,4*3600000).expired).toBe(true);});
 it('matches the server quiet-time and streak XP formula',()=>{expect(scoreXP({quietSeconds:64.9,bestStreak:60})).toBe(16);});
});
