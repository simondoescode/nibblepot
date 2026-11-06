import {afterEach,beforeEach,expect,it,vi} from 'vitest';
let stack: Record<string,unknown>[];
let position:number;
let events:EventTarget;
beforeEach(()=>{
  vi.resetModules();
  stack=[{nibblepotIndex:0}];position=0;events=new EventTarget();
  const move=(step:number)=>{
    position=Math.max(0,Math.min(stack.length-1,position+step));
    queueMicrotask(()=>events.dispatchEvent(new Event('popstate')));
  };
  vi.stubGlobal('window',events);
  vi.stubGlobal('location',{href:'https://example.test/nibblepot/'});
  vi.stubGlobal('history',{
    get state(){return stack[position];},
    pushState(state:Record<string,unknown>){stack.splice(position+1);stack.push(state);position++;},
    back:()=>move(-1),forward:()=>move(1),
  });
});
afterEach(()=>vi.unstubAllGlobals());
it('adds exactly one same-page entry and resolves dismissal before route navigation',async()=>{
  const {registerSheet,dismissSheet}=await import('../src/lib/sheetHistory');
  const close=vi.fn();
  const cleanup=registerSheet(close,'filters');
  expect(history.state.nibblepotSheet).toBe('filters');
  expect(history.state.nibblepotIndex).toBe(0);
  await dismissSheet();
  expect(position).toBe(0);
  expect(close).toHaveBeenCalled();
  cleanup();
  await dismissSheet();
  expect(position).toBe(0);
});
it('browser Back closes the sheet, and reopening a Forward entry does not add another entry',async()=>{
  const {registerSheet}=await import('../src/lib/sheetHistory');
  const close=vi.fn();
  const cleanup=registerSheet(close,'filters');
  history.back();await Promise.resolve();
  expect(close).toHaveBeenCalledOnce();
  cleanup();
  history.forward();await Promise.resolve();
  const again=registerSheet(close,'filters');
  expect(stack).toHaveLength(2);
  again();await Promise.resolve();
});
it('coalesces simultaneous close/navigation requests into one history traversal',async()=>{
  const {registerSheet,dismissSheet}=await import('../src/lib/sheetHistory');
  const cleanup=registerSheet(vi.fn(),'planner');
  const a=dismissSheet(),b=dismissSheet();
  expect(a).toBe(b);
  await Promise.all([a,b]);
  expect(position).toBe(0);
  cleanup();
});
