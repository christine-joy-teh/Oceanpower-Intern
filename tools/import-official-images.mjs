import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataFile=path.join(root,'src','content','official-products.json');
const imageDirectory=path.join(root,'assets','official-products');
const data=JSON.parse(await fs.readFile(dataFile,'utf8'));
await fs.mkdir(imageDirectory,{recursive:true});
let saved=0;

for(const category of data.categories){
  for(const entry of category.entries){
    if(entry.description||!entry.sourceImages?.length)continue;
    entry.localImages=[];
    for(const sourceImage of entry.sourceImages){
      const url=new URL(sourceImage);
      if(!['rc0.zihu.com','www.opxincai.com'].includes(url.hostname))continue;
      try{
        const response=await fetch(url,{headers:{Referer:'https://www.opxincai.com/'}});
        const contentType=response.headers.get('content-type')||'';
        const size=Number(response.headers.get('content-length')||0);
        if(!response.ok||!/^image\/(jpeg|png|webp)$/i.test(contentType)||size>5_000_000)throw new Error(`Unexpected image response: ${response.status} ${contentType}`);
        const bytes=Buffer.from(await response.arrayBuffer());
        if(bytes.length>5_000_000)throw new Error('Image exceeds 5 MB');
        const extension=contentType.includes('png')?'png':contentType.includes('webp')?'webp':'jpg';
        const filename=`${crypto.createHash('sha256').update(bytes).digest('hex').slice(0,20)}.${extension}`;
        await fs.writeFile(path.join(imageDirectory,filename),bytes);
        entry.localImages.push(`/assets/official-products/${filename}`);
        saved++;
      }catch(error){
        process.stderr.write(`[official-images] ${entry.title}: ${error.message}\n`);
      }
    }
    if(!entry.localImages.length)delete entry.localImages;
  }
}

await fs.writeFile(dataFile,`${JSON.stringify(data,null,2)}\n`,'utf8');
process.stdout.write(`[official-images] saved ${saved} image-only source images\n`);
