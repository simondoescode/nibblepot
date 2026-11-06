import {afterEach,expect,it,vi} from 'vitest';
import {refreshPwa} from '../src/lib/refresh';
afterEach(()=>vi.unstubAllGlobals());
it('begins update work immediately but waits for release before reloading',async()=>{
  const reload=vi.fn();
  const update=vi.fn().mockResolvedValue(undefined);
  const getRegistration=vi.fn().mockResolvedValue({update,waiting:null});
  vi.stubGlobal('navigator',{onLine:true,serviceWorker:{getRegistration}});
  vi.stubGlobal('location',{origin:'https://example.test',reload});
  vi.stubGlobal('window',{location:{reload}});
  let settled!:()=>void;
  const barrier=new Promise<void>(resolve=>{settled=resolve;});
  const operation=refreshPwa(barrier);
  await vi.waitFor(()=>expect(update).toHaveBeenCalledOnce());
  expect(reload).not.toHaveBeenCalled();
  settled();await operation;
  expect(reload).toHaveBeenCalledOnce();
});
it('reloads offline and when service worker updating fails',async()=>{
  const reload=vi.fn();
  vi.stubGlobal('location',{origin:'https://example.test',reload});
  vi.stubGlobal('window',{location:{reload}});
  vi.stubGlobal('navigator',{onLine:false});
  await refreshPwa();expect(reload).toHaveBeenCalledTimes(1);
  vi.stubGlobal('navigator',{onLine:true,serviceWorker:{getRegistration:vi.fn().mockRejectedValue(new Error('offline'))}});
  await refreshPwa();expect(reload).toHaveBeenCalledTimes(2);
});
