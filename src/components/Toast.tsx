import { useEffect, useState } from 'react';
export function Toast({message}: {message:string}) {
  const [leaving,setLeaving] = useState(false);
  useEffect(() => {
    const timer=setTimeout(() => setLeaving(true),2300);
    return () => clearTimeout(timer);
  },[]);
  return <div className={`toast${leaving ? ' is-leaving' : ''}`} role="status" aria-live="polite">{message}</div>;
}
