export function validateConfig(url,key){
 const u=new URL(url);
 if(u.protocol!=='https:'||!/^[-a-z0-9]+\.supabase\.co$/.test(u.hostname)||u.port||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw Error('Invalid public Supabase origin');
 if(typeof key!=='string')throw Error('Invalid public key');
 let allowed=/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key);
 if(!allowed&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)){
  try{allowed=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch(error){throw Error('Invalid anon key encoding',{cause:error});}
 }
 if(!allowed)throw Error('Only public publishable/anon keys allowed');
 return {url:u.origin,key};
}
