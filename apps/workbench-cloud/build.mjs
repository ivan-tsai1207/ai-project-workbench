import {readFileSync,writeFileSync,mkdirSync,rmSync,copyFileSync} from 'node:fs';
import {validateConfig} from './public/config-validation.mjs';
const config=!process.env.SUPABASE_URL&&!process.env.SUPABASE_PUBLISHABLE_KEY?{configured:false}:validateConfig(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY);
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const file of ['app.mjs','client.mjs','config-validation.mjs','styles.css'])copyFileSync('public/'+file,'dist/'+file);
writeFileSync('dist/config.mjs','export default '+JSON.stringify(config).replace(/</g,'\\u003c')+';\n');
const csp="default-src 'none'; script-src 'self'; style-src 'self'; connect-src "+(config.url||"'none'")+"; img-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
writeFileSync('dist/index.html',readFileSync('public/index.html','utf8').replace('__CSP__',csp));
console.log('Static cloud build complete; AI disabled.');
