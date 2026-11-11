import {describe,it,expect} from 'vitest';
import {scoreXP,sessionTiming} from '../src/game';
import {scoreLesson} from '../worker/model';
describe('client/server scoring contract',()=>{
 it.each([0,4,5,29,30,59,60,299,300,7198])('shows exactly the server award for %s seconds',seconds=>{
  const input={quietSeconds:seconds,measuredSeconds:seconds,bestStreak:seconds};
  const server=scoreLesson(input,new Date(0),new Date(Math.max(1,seconds)*1000));
  expect(scoreXP(input)).toBe(server.xp);
 });
 it('stops before server measured-time cap and distinguishes permanent wall expiry',()=>{
  expect(sessionTiming(7197,1000,2000).autoFinish).toBe(false);
  expect(sessionTiming(7198,1000,2000).autoFinish).toBe(true);
  expect(sessionTiming(100,1000,1000+3.9*3600000)).toEqual({autoFinish:true,expired:false});
  expect(sessionTiming(100,1000,1000+4*3600000)).toEqual({autoFinish:true,expired:true});
 });
});
