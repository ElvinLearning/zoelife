/** Assemble only public files. Relative URLs in directory aliases need one
 * extra parent segment; hash-only anchors must continue to target this page.
 * node tools/assemble.mjs [output-directory]
 */
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const out=resolve(process.argv[2] || join(root,'_site'));
const pages=[...readdirSync(root).filter(f=>f.endsWith('.html')),
 ...['blog','courses'].flatMap(d=>readdirSync(join(root,d)).filter(f=>f.endsWith('.html')).map(f=>`${d}/${f}`))];
mkdirSync(out,{recursive:true});
for(const file of [...pages,'robots.txt','sitemap.xml','favicon.svg','css','js','fonts','assets',...(existsSync(join(root,'CNAME'))?['CNAME']:[])]) {
 mkdirSync(dirname(join(out,file)),{recursive:true});
 cpSync(join(root,file),join(out,file),{recursive:true});
}
for(const file of pages.filter(f=>!['index.html','404.html'].includes(f))) {
 const html=readFileSync(join(root,file),'utf8').replace(/\b(href|src|poster)="([^"\s]+)"/g,(all,attr,url)=>{
  if(/^(?:[a-z]+:|\/|#)/i.test(url)) return all;
  return `${attr}="../${url}"`;
 });
 const target=join(out,file.replace(/\.html$/,''),'index.html');
 mkdirSync(dirname(target),{recursive:true});writeFileSync(target,html);
}
console.log(`Assembled ${pages.length} pages and directory aliases in ${out}`);
