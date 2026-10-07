
(function(){
var $=function(i){return document.getElementById(i)};
var P=function(){return window.PDFLib};
function ranges(s,n){var o=[];String(s).split(',').forEach(function(p){p=p.trim();if(!p)return;var m=p.match(/^(\d+)(?:-(\d+))?$/);if(!m)throw new Error('Invalid pages: "'+p+'". Use a format like 1-3,5.');var a=+m[1],b=m[2]?+m[2]:a;if(a<1||b>n||a>b)throw new Error('Pages must be between 1 and '+n+'.');for(var i=a;i<=b;i++)o.push(i-1)});if(!o.length)throw new Error('Enter the page numbers.');return o}
async function load(f){return P().PDFDocument.load(await f.arrayBuffer())}
async function copy(src,idx){var o=await P().PDFDocument.create();(await o.copyPages(src,idx)).forEach(function(p){o.addPage(p)});return o}
var PDFS='application/pdf';
async function loadPdfJs(){if(!window.pdfjsLib)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
function loadScript(u){return new Promise(function(res,rej){var e=document.createElement('script');e.src=u;e.onload=res;e.onerror=function(){rej(new Error('Could not load a required library. Check your internet connection.'))};document.head.appendChild(e)})}


var tools={
merge:{n:'Merge PDF',i:'📄',d:'Combine several PDF files into one.',acc:PDFS,multi:1,min:2,out:'merged.pdf',
 run:async function(fs){var o=await P().PDFDocument.create();for(var f of fs){var s=await load(f);(await o.copyPages(s,s.getPageIndices())).forEach(function(p){o.addPage(p)})}return o.save()}},
split:{n:'Split PDF',i:'✂',d:'Pick pages or ranges and save them as a new PDF.',acc:PDFS,min:1,out:'split.pdf',
 opts:'<label>Pages to keep<input name="pages" placeholder="1-3,5,8"></label>',
 run:async function(fs,o){var s=await load(fs[0]);return (await copy(s,ranges(o.pages,s.getPageCount()))).save()}},
remove:{n:'Remove pages',i:'✕',d:'Delete pages you do not need.',acc:PDFS,min:1,out:'removed.pdf',
 opts:'<label>Pages to remove<input name="pages" placeholder="2,4-6"></label>',
 run:async function(fs,o){var s=await load(fs[0]),n=s.getPageCount(),r=ranges(o.pages,n);var keep=s.getPageIndices().filter(function(i){return r.indexOf(i)<0});if(!keep.length)throw new Error('You cannot remove every page.');return (await copy(s,keep)).save()}},
rotate:{n:'Rotate PDF',i:'↻',d:'Turn every page clockwise.',acc:PDFS,min:1,out:'rotated.pdf',
 opts:'<label>Angle<select name="a"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">90° counter-clockwise</option></select></label>',
 run:async function(fs,o){var s=await load(fs[0]);s.getPages().forEach(function(p){p.setRotation(P().degrees((p.getRotation().angle+ +o.a)%360))});return s.save()}},
images:{n:'Images to PDF',i:'🖼',d:'Turn JPG and PNG images into one PDF.',acc:'image/jpeg,image/png',multi:1,min:1,out:'images.pdf',
 run:async function(fs){var o=await P().PDFDocument.create();for(var f of fs){var b=await f.arrayBuffer();var im=f.type==='image/png'?await o.embedPng(b):await o.embedJpg(b);var pg=o.addPage([im.width,im.height]);pg.drawImage(im,{x:0,y:0,width:im.width,height:im.height})}return o.save()}},
numbers:{n:'Add page numbers',i:'#',d:'Number every page of your PDF.',acc:PDFS,min:1,out:'numbered.pdf',
 opts:'<label>Position<select name="pos"><option value="c">Bottom center</option><option value="r">Bottom right</option><option value="l">Bottom left</option></select></label>',
 run:async function(fs,o){var s=await load(fs[0]),f=await s.embedFont(P().StandardFonts.Helvetica),ps=s.getPages();ps.forEach(function(p,i){var t=(i+1)+' / '+ps.length,w=p.getWidth(),tw=f.widthOfTextAtSize(t,11);var x=o.pos==='l'?30:o.pos==='r'?w-30-tw:(w-tw)/2;p.drawText(t,{x:x,y:20,size:11,font:f,color:P().rgb(.2,.2,.2)})});return s.save()}},
rearrange:{n:'Rearrange PDF',i:'⇅',d:'List pages in your new order, or reverse the whole file. Pages you leave out are removed.',acc:PDFS,min:1,out:'rearranged.pdf',
 opts:'<label>Mode<select name="m"><option value="c">Custom order</option><option value="r">Reverse all pages</option></select></label><label>New order (custom mode)<input name="o" placeholder="3,1,2,4-6"></label>',
 run:async function(fs,o){var s=await load(fs[0]),n=s.getPageCount(),idx=o.m==='r'?s.getPageIndices().reverse():ranges(o.o,n);return (await copy(s,idx)).save()}},
pdf2jpg:{n:'PDF to JPG',i:'📷',d:'Save every page of a PDF as a JPG image. Several pages are saved in one ZIP file.',acc:PDFS,min:1,out:'pages.zip',
 opts:'<label>Quality<select name="s"><option value="1.5">Standard</option><option value="2" selected>High</option><option value="3">Very high</option></select></label>',
 run:async function(fs,o){
  var png=cur==='pdf2png',ext=png?'.png':'.jpg';if(!window.pdfjsLib)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  var pdf=await pdfjsLib.getDocument({data:await fs[0].arrayBuffer()}).promise,n=pdf.numPages;
  if(n>100)throw new Error('This PDF has more than 100 pages. Split it first.');
  var base=fs[0].name.replace(/\.pdf$/i,''),imgs=[];
  for(var i=1;i<=n;i++){say('Converting page '+i+' of '+n+'...');
   var pg=await pdf.getPage(i),vp=pg.getViewport({scale:+o.s}),c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);
   var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
   await pg.render({canvasContext:x,viewport:vp}).promise;
   imgs.push(await new Promise(function(r){c.toBlob(r,png?'image/png':'image/jpeg',.92)}));c.width=c.height=0}
  if(n===1)return {blob:imgs[0],name:base+ext};
  if(!window.JSZip)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  var z=new JSZip();imgs.forEach(function(b,k){z.file(base+'-page-'+(k+1)+ext,b)});
  return {blob:await z.generateAsync({type:'blob'}),name:base+'-pages.zip'}}},
crop:{n:'Crop PDF',i:'⛶',d:'Trim the edges of every page. Enter how much to cut from each side, in percent of the page.',acc:PDFS,min:1,out:'cropped.pdf',
 opts:'<label>Top (%)<input name="t" type="number" value="5" min="0" max="45"></label><label>Bottom (%)<input name="b" type="number" value="5" min="0" max="45"></label><label>Left (%)<input name="l" type="number" value="5" min="0" max="45"></label><label>Right (%)<input name="r" type="number" value="5" min="0" max="45"></label>',
 run:async function(fs,o){var s=await load(fs[0]),T=+o.t||0,B=+o.b||0,Lf=+o.l||0,R=+o.r||0;if(T+B>=90||Lf+R>=90)throw new Error('You are cropping too much. Keep each pair under 90%.');
  s.getPages().forEach(function(p){var m=p.getMediaBox(),w=m.width,h=m.height,x=m.x+w*Lf/100,y=m.y+h*B/100,ww=w*(1-(Lf+R)/100),hh=h*(1-(T+B)/100);p.setMediaBox(x,y,ww,hh);p.setCropBox(x,y,ww,hh)});return s.save()}},
nup:{n:'Pages per sheet',i:'▦',d:'Place 2, 4, 6 or 9 pages on one A4 sheet to save paper.',acc:PDFS,min:1,out:'pages-per-sheet.pdf',
 opts:'<label>Pages per sheet<select name="n"><option>2</option><option selected>4</option><option>6</option><option>9</option></select></label>',
 run:async function(fs,o){var n=+o.n,s=await load(fs[0]),out=await P().PDFDocument.create(),L={2:[2,1],4:[2,2],6:[2,3],9:[3,3]}[n],cols=L[0],rows=L[1],SW=n===2?841.89:595.28,SH=n===2?595.28:841.89,m=14,cw=(SW-2*m)/cols,ch=(SH-2*m)/rows,emb=await out.embedPages(s.getPages());
  for(var i=0;i<emb.length;i+=n){var sh=out.addPage([SW,SH]);for(var j=0;j<n&&i+j<emb.length;j++){var e=emb[i+j],sc=Math.min((cw-8)/e.width,(ch-8)/e.height),w=e.width*sc,h=e.height*sc,c=j%cols,r=Math.floor(j/cols),x=m+c*cw+(cw-w)/2,y=SH-m-(r+1)*ch+(ch-h)/2;sh.drawPage(e,{x:x,y:y,width:w,height:h});sh.drawRectangle({x:x,y:y,width:w,height:h,borderColor:P().rgb(.75,.75,.75),borderWidth:.5})}}
  return out.save()}},
sign:{n:'Sign PDF',i:'✍',d:'Select your PDF and a signature image (PNG or JPG) together, or just type your name.',acc:'application/pdf,image/jpeg,image/png',multi:1,min:1,out:'signed.pdf',
 opts:'<label>Signature text (if no image)<input name="t" placeholder="Your name"></label><label>Page<input name="pg" value="last" placeholder="1, last or all"></label><label>Position<select name="pos"><option value="r">Bottom right</option><option value="c">Bottom center</option><option value="l">Bottom left</option></select></label><label>Size (% of page width)<input name="sz" type="number" value="25" min="5" max="80"></label>',
 run:async function(fs,o){
  var pf=fs.filter(function(f){return f.type===PDFS||/\.pdf$/i.test(f.name)})[0],im=fs.filter(function(f){return /^image\//.test(f.type)})[0];
  if(!pf)throw new Error('Add the PDF you want to sign.');
  var s=await load(pf),bytes,png=true;
  if(im){bytes=await im.arrayBuffer();png=im.type==='image/png'}
  else{var t=(o.t||'').trim();if(!t)throw new Error('Add a signature image or type your name.');
   var c=document.createElement('canvas'),x=c.getContext('2d'),f='64px "Brush Script MT","Segoe Script","Snell Roundhand",cursive';x.font=f;c.width=Math.ceil(x.measureText(t).width)+30;c.height=100;x=c.getContext('2d');x.font=f;x.fillStyle='#10256b';x.textBaseline='middle';x.fillText(t,15,50);
   var bl=await new Promise(function(r){c.toBlob(r,'image/png')});bytes=await bl.arrayBuffer()}
  var img=png?await s.embedPng(bytes):await s.embedJpg(bytes),ps=s.getPages(),n=ps.length,pg=String(o.pg||'last').trim().toLowerCase(),idx;
  if(pg==='all')idx=s.getPageIndices();else if(pg==='last'||pg==='')idx=[n-1];else{var k=parseInt(pg,10);if(!(k>=1&&k<=n))throw new Error('Page must be between 1 and '+n+'.');idx=[k-1]}
  var pct=Math.min(80,Math.max(5,+o.sz||25))/100;
  idx.forEach(function(i){var p=ps[i],w=p.getWidth(),sw=w*pct,sh=sw*img.height/img.width,m=36,xx=o.pos==='l'?m:o.pos==='c'?(w-sw)/2:w-m-sw;p.drawImage(img,{x:xx,y:m,width:sw,height:sh})});
  return s.save()}},
pagesize:{n:'Change page size',i:'▭',d:'Resize every page to A4, A3, A5, Letter or Legal. Content is scaled to fit.',acc:PDFS,min:1,out:'resized.pdf',
 opts:'<label>New size<select name="z"><option value="a4">A4</option><option value="a3">A3</option><option value="a5">A5</option><option value="letter">Letter</option><option value="legal">Legal</option></select></label>',
 run:async function(fs,o){var D={a4:[595.28,841.89],a3:[841.89,1190.55],a5:[419.53,595.28],letter:[612,792],legal:[612,1008]}[o.z],s=await load(fs[0]),out=await P().PDFDocument.create(),emb=await out.embedPages(s.getPages());emb.forEach(function(e){var l=e.width>e.height,W=l?D[1]:D[0],H=l?D[0]:D[1],sc=Math.min(W/e.width,H/e.height),w=e.width*sc,h=e.height*sc;out.addPage([W,H]).drawPage(e,{x:(W-w)/2,y:(H-h)/2,width:w,height:h})});return out.save()}},
createpdf:{n:'Create PDF',i:'＋',d:'Type or paste text and save it as a PDF. English (Latin) letters only.',nofile:1,min:0,out:'document.pdf',
 opts:'<label>Your text<textarea name="t" rows="8" placeholder="Type or paste your text here"></textarea></label><label>Font size<select name="f"><option>10</option><option selected>12</option><option>14</option><option>18</option></select></label>',
 run:async function(fs,o){var txt=(o.t||'').replace(/\r/g,'');if(!txt.trim())throw new Error('Type some text first.');
  var d=await P().PDFDocument.create(),f=await d.embedFont(P().StandardFonts.Helvetica),sz=+o.f,W=595.28,H=841.89,M=56,mw=W-2*M,pg=d.addPage([W,H]),y=H-M;
  try{txt.split('\n').forEach(function(par){var ln='';function flush(){if(y<M+sz){pg=d.addPage([W,H]);y=H-M}pg.drawText(ln,{x:M,y:y-sz,size:sz,font:f});y-=sz*1.4;ln=''}
   par.split(' ').forEach(function(w){var t=ln?ln+' '+w:w;if(f.widthOfTextAtSize(t,sz)>mw&&ln){flush();ln=w}else ln=t});flush()})}
  catch(e){throw new Error('Only English (Latin) letters are supported in this version.')}
  return d.save()}},
qr:{n:'Create QR code',i:'▣',d:'Turn a link or text into a QR code image (PNG).',nofile:1,min:0,out:'qr-code.png',
 opts:'<label>Text or link<input name="t" placeholder="https://example.com"></label><label>Size<select name="z"><option value="256">Small</option><option value="512" selected>Medium</option><option value="1024">Large</option></select></label>',
 run:async function(fs,o){var t=(o.t||'').trim();if(!t)throw new Error('Enter a link or some text.');
  if(!window.qrcode)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js');
  if(qrcode.stringToBytesFuncs&&qrcode.stringToBytesFuncs['UTF-8'])qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
  var q=qrcode(0,'M');try{q.addData(t);q.make()}catch(e){throw new Error('That text is too long for a QR code.')}
  var n=q.getModuleCount(),m=4,u=Math.max(1,Math.floor(+o.z/(n+2*m))),sz=u*(n+2*m),c=document.createElement('canvas');c.width=c.height=sz;
  var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,sz,sz);x.fillStyle='#000';
  for(var r=0;r<n;r++)for(var k=0;k<n;k++)if(q.isDark(r,k))x.fillRect((k+m)*u,(r+m)*u,u,u);
  var b=await new Promise(function(res){c.toBlob(res,'image/png')});return {blob:b,name:'qr-code.png'}}},
compress:{n:'Compress PDF',i:'⇲',d:'Make a PDF smaller by turning each page into a compressed image. Text can no longer be selected afterwards.',acc:PDFS,min:1,out:'compressed.pdf',
 opts:'<label>Compression<select name="q"><option value="h">Light (better quality)</option><option value="m" selected>Medium</option><option value="s">Strong (smallest file)</option></select></label>',
 run:async function(fs,o){await loadPdfJs();var Q={h:[2,.8],m:[1.6,.62],s:[1.3,.45]}[o.q],pdf=await pdfjsLib.getDocument({data:await fs[0].arrayBuffer()}).promise,n=pdf.numPages;
  if(n>100)throw new Error('This PDF has more than 100 pages. Split it first.');var out=await P().PDFDocument.create();
  for(var i=1;i<=n;i++){say('Compressing page '+i+' of '+n+'...');var pg=await pdf.getPage(i),v1=pg.getViewport({scale:1}),vp=pg.getViewport({scale:Q[0]}),c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);
   var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:x,viewport:vp}).promise;
   var b=await new Promise(function(r){c.toBlob(r,'image/jpeg',Q[1])}),im=await out.embedJpg(await b.arrayBuffer());out.addPage([v1.width,v1.height]).drawImage(im,{x:0,y:0,width:v1.width,height:v1.height});c.width=c.height=0}
  var bytes=await out.save();if(bytes.length>=fs[0].size)throw new Error('Could not make this PDF smaller. It is already well compressed.');return bytes}},
repair:{n:'Repair PDF',i:'🔧',d:'Tries to rebuild a damaged PDF by copying its pages into a new file. Works for mild damage only.',acc:PDFS,min:1,out:'repaired.pdf',
 run:async function(fs){var s=await P().PDFDocument.load(await fs[0].arrayBuffer(),{ignoreEncryption:true,throwOnInvalidObject:false,updateMetadata:false}),idx=s.getPageIndices();if(!idx.length)throw new Error('No readable pages found in this file.');return (await copy(s,idx)).save()}},
pdf2txt:{n:'PDF to Text',i:'T',d:'Copy the text out of a PDF into a TXT file. Scanned PDFs have no text to extract.',acc:PDFS,min:1,out:'text.txt',
 run:async function(fs){await loadPdfJs();var pdf=await pdfjsLib.getDocument({data:await fs[0].arrayBuffer()}).promise,res=[];
  for(var i=1;i<=pdf.numPages;i++){say('Reading page '+i+' of '+pdf.numPages+'...');var tc=await (await pdf.getPage(i)).getTextContent(),ln='';tc.items.forEach(function(it){ln+=it.str+(it.hasEOL?'\n':' ')});res.push('--- Page '+i+' ---\n'+ln.trim())}
  var txt=res.join('\n\n');if(!txt.replace(/--- Page \d+ ---|\s/g,'').length)throw new Error('No text found. This PDF may be a scan.');
  return {blob:new Blob([txt],{type:'text/plain'}),name:fs[0].name.replace(/\.pdf$/i,'')+'.txt'}}},
ocr:{n:'PDF OCR',i:'Aa',d:'Make a scanned PDF searchable, or extract its text. The first run downloads the OCR engine and can take a minute. Your file is not uploaded.',acc:PDFS,min:1,out:'ocr.pdf',
 opts:'<label>Language<select name="l"><option value="eng">English</option><option value="ben">Bengali</option><option value="eng+ben">English + Bengali</option><option value="hin">Hindi</option><option value="ara">Arabic</option><option value="spa">Spanish</option><option value="fra">French</option><option value="deu">German</option></select></label><label>Result<select name="m"><option value="pdf">Searchable PDF</option><option value="txt">Text file (.txt)</option></select></label><label>Scan quality<select name="s"><option value="2">Standard</option><option value="3">High (slower)</option></select></label>',
 run:async function(fs,o){
  await loadPdfJs();
  if(!window.Tesseract)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js');
  var pdf=await pdfjsLib.getDocument({data:await fs[0].arrayBuffer()}).promise,n=pdf.numPages,cp=0;
  if(n>30)throw new Error('More than 30 pages. OCR is slow in the browser, so split the file first.');
  say('Loading the OCR engine... (the first time takes a while)');
  var w=await Tesseract.createWorker(o.l.split('+'),1,{logger:function(m){if(m.status==='recognizing text')say('Page '+cp+' of '+n+': '+Math.round(m.progress*100)+'%')}});
  try{
   var txt=[],out=await P().PDFDocument.create(),pm=o.m==='pdf';
   for(var i=1;i<=n;i++){cp=i;say('Preparing page '+i+' of '+n+'...');
    var pg=await pdf.getPage(i),vp=pg.getViewport({scale:+o.s}),c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);
    var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:x,viewport:vp}).promise;
    var r=await w.recognize(c,{},pm?{pdf:true}:{});
    if(pm){var by=r.data.pdf;if(!by){by=(await w.getPDF('ocr')).data}var sp=await P().PDFDocument.load(new Uint8Array(by));(await out.copyPages(sp,sp.getPageIndices())).forEach(function(p){out.addPage(p)})}
    else txt.push('--- Page '+i+' ---\n'+r.data.text.trim());
    c.width=c.height=0}
   if(pm)return out.save();
   return {blob:new Blob([txt.join('\n\n')],{type:'text/plain'}),name:fs[0].name.replace(/\.pdf$/i,'')+'.txt'}
  }finally{await w.terminate()}}},
extract:{n:'Extract images',i:'🖼',d:'Save the pictures that are embedded inside a PDF. Several images are saved in one ZIP file.',acc:PDFS,min:1,out:'images.zip',
 opts:'<label>Format<select name="f"><option value="png">PNG (best quality)</option><option value="jpg">JPG (smaller)</option></select></label><label>Skip images smaller than<select name="m"><option value="0">Keep all</option><option value="50" selected>50 pixels (skip icons)</option><option value="150">150 pixels</option></select></label>',
 run:async function(fs,o){await loadPdfJs();var OPS=pdfjsLib.OPS,pdf=await pdfjsLib.getDocument({data:await fs[0].arrayBuffer()}).promise,n=pdf.numPages,min=+o.m,jpg=o.f==='jpg',ext=jpg?'.jpg':'.png',base=fs[0].name.replace(/\.pdf$/i,''),found=[];
  if(n>100)throw new Error('This PDF has more than 100 pages. Split it first.');
  for(var p=1;p<=n&&found.length<200;p++){say('Looking for images on page '+p+' of '+n+'...');
   var pg=await pdf.getPage(p),ops=await pg.getOperatorList(),seen={};
   for(var i=0;i<ops.fnArray.length&&found.length<200;i++){
    if(ops.fnArray[i]!==OPS.paintImageXObject)continue;var id=ops.argsArray[i][0];if(seen[id])continue;seen[id]=1;
    var im=await new Promise(function(res){var d=false;function f(v){if(!d){d=true;res(v)}}try{pg.objs.get(id,f)}catch(e){f(null)}setTimeout(function(){f(null)},4000)});
    if(!im||!im.width||!im.height||Math.min(im.width,im.height)<min)continue;
    var c=imgToCanvas(im,jpg),b=await new Promise(function(r){c.toBlob(r,jpg?'image/jpeg':'image/png',.92)});c.width=c.height=0;
    if(b)found.push({b:b,p:p})}}
  if(!found.length)throw new Error('No embedded images found. Pages made only of text or drawings have no pictures to extract.');
  if(found.length===1)return {blob:found[0].b,name:base+'-image'+ext};
  if(!window.JSZip)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  var z=new JSZip();found.forEach(function(f,k){z.file(base+'-page'+f.p+'-image'+(k+1)+ext,f.b)});
  return {blob:await z.generateAsync({type:'blob'}),name:base+'-images.zip'}}},
fillout:{n:'Fill out PDF',i:'☑',d:'Type into the form fields of a fillable PDF. It works with PDFs that have real form fields, not with plain scans.',acc:PDFS,min:1,out:'filled.pdf',
 prep:async function(fl){if(!fl.length)return '';var d=await load(fl[0]),fs=d.getForm().getFields(),T=P();
  if(!fs.length)return '<p class="note">No fillable form fields found in this PDF. Use Annotate PDF to type on a normal PDF.</p>';
  var h='';
  fs.forEach(function(f,i){var nm=esc(f.getName());
   if(f instanceof T.PDFTextField){h+='<label>'+nm+'<input name="f'+i+'" value="'+esc(f.getText()||'')+'"></label>'}
   else if(f instanceof T.PDFCheckBox){h+='<label class="chk"><input type="checkbox" name="f'+i+'"'+(f.isChecked()?' checked':'')+'> '+nm+'</label>'}
   else if(f instanceof T.PDFDropdown||f instanceof T.PDFRadioGroup||f instanceof T.PDFOptionList){var sel=f.getSelected();sel=Array.isArray(sel)?sel[0]:sel;h+='<label>'+nm+'<select name="f'+i+'"><option value="">(none)</option>'+f.getOptions().map(function(op){return '<option'+(op===sel?' selected':'')+'>'+esc(op)+'</option>'}).join('')+'</select></label>'}});
  return h+'<label class="chk"><input type="checkbox" name="flat"> Make fields non-editable after filling</label>'},
 run:async function(fs,o){var d=await load(fs[0]),form=d.getForm(),F=form.getFields(),T=P();if(!F.length)throw new Error('This PDF has no fillable form fields.');
  try{F.forEach(function(f,i){var v=o['f'+i];if(v===undefined)return;
   if(f instanceof T.PDFTextField)f.setText(String(v));
   else if(f instanceof T.PDFCheckBox){if(v)f.check();else f.uncheck()}
   else if(f instanceof T.PDFDropdown||f instanceof T.PDFRadioGroup||f instanceof T.PDFOptionList){if(v)f.select(v);else f.clear()}});
   if(o.flat)form.flatten()}
  catch(e){throw new Error('Could not fill a field. Only English (Latin) letters are supported.')}
  return d.save()}},
annotate:{n:'Annotate PDF',i:'✎',d:'Add text, highlights, boxes and pen drawings to your PDF. Click or drag on the page, then press the button.',acc:PDFS,min:1,out:'annotated.pdf',
 prep:async function(fl){return fl.length?EDHTML:''},
 after:function(fl){edInit(fl[0])},
 run:async function(fs){if(!ED||ED.file!==fs[0]||!ED.ann.length)throw new Error('Add at least one text, highlight, box or pen mark first.');
  var s=await load(fs[0]),f=await s.embedFont(P().StandardFonts.Helvetica),ps=s.getPages();
  function col(h){return P().rgb(parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255)}
  try{ED.ann.forEach(function(a){var pg=ps[a.p-1];if(pg.getRotation().angle%360!==0)throw new Error('ROT');var H=pg.getHeight(),k=a.k,c=col(a.c);
   if(a.t==='text')pg.drawText(a.s,{x:a.x/k,y:H-a.y/k,size:a.z,font:f,color:c});
   else if(a.t==='hl')pg.drawRectangle({x:a.x/k,y:H-(a.y+a.h)/k,width:a.w/k,height:a.h/k,color:c,opacity:.35});
   else if(a.t==='rect')pg.drawRectangle({x:a.x/k,y:H-(a.y+a.h)/k,width:a.w/k,height:a.h/k,borderColor:c,borderWidth:1.5});
   else if(a.t==='pen'){for(var i=1;i<a.pts.length;i++)pg.drawLine({start:{x:a.pts[i-1][0]/k,y:H-a.pts[i-1][1]/k},end:{x:a.pts[i][0]/k,y:H-a.pts[i][1]/k},thickness:1.6,color:c})}})}
  catch(e){throw new Error(e.message==='ROT'?'A marked page is rotated. Fix it with the Rotate PDF tool first.':'Only English (Latin) letters are supported for text.')}
  return s.save()}},
watermark:{n:'Add watermark',i:'💧',d:'Stamp diagonal text across every page.',acc:PDFS,min:1,out:'watermarked.pdf',
 opts:'<label>Watermark text<input name="t" value="CONFIDENTIAL" maxlength="30"></label>',
 run:async function(fs,o){var t=(o.t||'').trim();if(!t)throw new Error('Enter the watermark text.');var s=await load(fs[0]),f=await s.embedFont(P().StandardFonts.HelveticaBold);s.getPages().forEach(function(p){var w=p.getWidth(),h=p.getHeight(),sz=Math.min(80,.75*Math.hypot(w,h)/(t.length*.62)),tw=f.widthOfTextAtSize(t,sz);p.drawText(t,{x:w/2-tw/2*.7071,y:h/2-tw/2*.7071,size:sz,font:f,rotate:P().degrees(45),color:P().rgb(.5,.5,.5),opacity:.3})});return s.save()}}
};
tools.jpg2pdf=Object.assign({},tools.images,{n:'JPG to PDF',i:'J',d:'Turn one or more JPG images into a single PDF.',acc:'image/jpeg',out:'jpg-images.pdf'});
tools.png2pdf=Object.assign({},tools.images,{n:'PNG to PDF',i:'N',d:'Turn one or more PNG images into a single PDF.',acc:'image/png',out:'png-images.pdf'});

tools.pdf2png=Object.assign({},tools.pdf2jpg,{n:'PDF to PNG',i:'P',d:'Save every page of a PDF as a PNG image. Several pages are saved in one ZIP file.'});
var cats=[
['Organize',['merge','split','remove','rotate','rearrange','nup','extract']],
['Edit',['numbers','watermark','crop','annotate','fillout','pagesize']],
['Create',['images','createpdf','Webpage to PDF|🌐','qr']],
['Optimize & repair',['compress','repair','ocr']],
['Security & privacy',['Protect PDF|🔒','Unlock PDF|🔓','sign','Redact PDF|▮']],
['Convert to PDF',['Word to PDF|W','PowerPoint to PDF|P','Excel to PDF|X','jpg2pdf','png2pdf','HTML to PDF|<>']],
['Convert from PDF',['PDF to Word|W','PDF to PowerPoint|P','PDF to Excel|X','pdf2jpg','pdf2png','pdf2txt']]
];
var cur,files=[];
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
var ch='';cats.forEach(function(c,ci){ch+='<div class="cat c'+(ci+1)+'"><h2>'+esc(c[0])+'</h2><div class="grid">';c[1].forEach(function(x){
 if(tools[x]){var t=tools[x];ch+='<button class="card live" data-t="'+x+'"><span class="hex">'+t.i+'</span><span><b>'+t.n+'</b></span></button>'}
 else{var p=x.split('|');ch+='<div class="card soon"><span class="hex">'+esc(p[1])+'</span><span><b>'+esc(p[0])+'</b><small>Coming soon</small></span></div>'}
});ch+='</div></div>'});
$('cats').innerHTML=ch;
var SL={"merge": "merge-pdf", "split": "split-pdf", "remove": "remove-pages", "rotate": "rotate-pdf", "images": "images-to-pdf", "numbers": "add-page-numbers", "watermark": "add-watermark", "rearrange": "rearrange-pages", "pdf2jpg": "pdf-to-jpg", "crop": "crop-pdf", "nup": "pages-per-sheet", "sign": "sign-pdf", "jpg2pdf": "jpg-to-pdf", "png2pdf": "png-to-pdf", "pagesize": "change-page-size", "createpdf": "create-pdf", "qr": "qr-code-generator", "compress": "compress-pdf", "repair": "repair-pdf", "pdf2png": "pdf-to-png", "pdf2txt": "pdf-to-text", "ocr": "pdf-ocr", "extract": "extract-images", "annotate": "annotate-pdf", "fillout": "fill-out-pdf"};
$('cats').onclick=function(e){var b=e.target.closest('[data-t]');if(b){location.href=SL[b.dataset.t]+'.html'}};

function say(t,err){var m=$('msg');m.textContent=t;m.className=err?'err':''}
function size(b){return b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'}
function open(id){
 if(!tools[id])id='merge';cur=id;var t=tools[id];files=[];
 $('tt').textContent=t.n;$('td').textContent=t.d;$('ti').textContent=t.i;
 $('file').accept=t.acc;$('file').multiple=!!t.multi;
 $('db').textContent=t.multi?'Drop files here':'Drop one file here';$('drop').style.display=t.nofile?'none':'';
 $('opts').innerHTML=t.opts||'';render();
}

var TH=new WeakMap();
function pageThumb(pg,w){var v=pg.getViewport({scale:1}),vp=pg.getViewport({scale:w/v.width}),c=document.createElement('canvas');c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);var x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);return pg.render({canvasContext:x,viewport:vp}).promise.then(function(){return c})}
async function thumb(f,box,meta){
 var base=size(f.size),isImg=/^image\//.test(f.type);box.textContent=isImg?'IMG':'PDF';
 try{var d=TH.get(f);
  if(!d){if(isImg)d={url:URL.createObjectURL(f)};
   else{await loadPdfJs();var pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,c=await pageThumb(await pdf.getPage(1),130);d={url:c.toDataURL('image/jpeg',.75),pages:pdf.numPages}}
   TH.set(f,d)}
  var im=new Image();im.src=d.url;im.alt='Preview of '+f.name;box.textContent='';box.appendChild(im);
  if(d.pages)meta.textContent=d.pages+(d.pages===1?' page · ':' pages · ')+base}
 catch(e){}}
async function preview(b,box,nm){box.textContent='';var ext=(nm.split('.').pop()||'').toLowerCase();
 try{
  if(ext==='png'||ext==='jpg'){var im=new Image();im.src=URL.createObjectURL(b);im.alt='Preview';box.appendChild(im)}
  else if(ext==='pdf'){await loadPdfJs();var pdf=await pdfjsLib.getDocument({data:await b.arrayBuffer()}).promise,c=await pageThumb(await pdf.getPage(1),180);box.appendChild(c);var m=document.createElement('small');m.textContent=pdf.numPages+(pdf.numPages===1?' page':' pages');box.appendChild(m)}
  else if(ext==='txt'){var p=document.createElement('pre');p.textContent=(await b.text()).slice(0,220);box.appendChild(p)}
  else box.textContent=ext.toUpperCase()}
 catch(e){box.textContent=ext.toUpperCase()}}

function imgToCanvas(im,jpg){var c=document.createElement('canvas');c.width=im.width;c.height=im.height;var x=c.getContext('2d');if(jpg){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}
 if(im.bitmap){x.drawImage(im.bitmap,0,0);return c}
 var d=im.data,n=im.width*im.height,id=x.createImageData(im.width,im.height),o=id.data,i,j;
 if(im.kind===3){for(i=0;i<n*4;i++)o[i]=d[i]}
 else if(im.kind===2){for(i=0,j=0;i<n;i++){o[j++]=d[i*3];o[j++]=d[i*3+1];o[j++]=d[i*3+2];o[j++]=255}}
 else{var rb=(im.width+7)>>3;for(var y=0;y<im.height;y++)for(var xx=0;xx<im.width;xx++){var v=((d[y*rb+(xx>>3)]>>(7-(xx&7)))&1)?255:0,q=(y*im.width+xx)*4;o[q]=o[q+1]=o[q+2]=v;o[q+3]=255}}
 if(jpg){var t=document.createElement('canvas');t.width=c.width;t.height=c.height;t.getContext('2d').putImageData(id,0,0);x.drawImage(t,0,0)}else x.putImageData(id,0,0);return c}
var PT=0;
function hook(t){var tok=++PT;if(!t.prep)return;var fl=files.slice();
 Promise.resolve(t.prep(fl)).then(function(h){if(tok!==PT||tools[cur]!==t)return;$('opts').innerHTML=h||'';if(t.after&&fl.length)t.after(fl)}).catch(function(){if(tok===PT)$('opts').innerHTML='<p class="note">Could not read this file. It may be damaged or protected.</p>'})}
var ED=null;
var EDHTML='<div class="ed"><div class="edt"><div class="seg" id="edtool"><button type="button" data-t="text" class="on">Text</button><button type="button" data-t="hl">Highlight</button><button type="button" data-t="rect">Box</button><button type="button" data-t="pen">Pen</button></div><label>Color<select id="edc"><option value="#d6453a">Red</option><option value="#1c1b18">Black</option><option value="#2563eb">Blue</option><option value="#16a34a">Green</option><option value="#facc15">Yellow</option></select></label><label>Text size<select id="eds"><option>12</option><option selected>16</option><option>24</option><option>36</option></select></label><button type="button" class="btn alt" id="edu">Undo</button></div><div class="edn"><button type="button" class="ic" id="edp" aria-label="Previous page">&lsaquo;</button><span id="edi">Loading...</span><button type="button" class="ic" id="edx" aria-label="Next page">&rsaquo;</button></div><div class="edw"><canvas id="edcv"></canvas></div><p class="edh">Pick a tool, then click or drag on the page. Press the button when you are done.</p></div>';
async function edInit(file){
 ED=null;var st={file:file,ann:[],pg:1,n:1,tool:'text',pdf:null,base:null,k:1,cur:null};
 var cv=$('edcv'),ctx=cv.getContext('2d');
 try{await loadPdfJs();st.pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;st.n=st.pdf.numPages}catch(e){$('edi').textContent='Could not open this PDF.';return}
 ED=st;
 async function show(){var pg=await st.pdf.getPage(st.pg),v=pg.getViewport({scale:1});st.k=640/v.width;var vp=pg.getViewport({scale:st.k}),b=document.createElement('canvas');b.width=Math.floor(vp.width);b.height=Math.floor(vp.height);var x=b.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,b.width,b.height);await pg.render({canvasContext:x,viewport:vp}).promise;st.base=b;cv.width=b.width;cv.height=b.height;$('edi').textContent='Page '+st.pg+' of '+st.n;draw()}
 function draw(){if(!st.base)return;ctx.drawImage(st.base,0,0);st.ann.concat(st.cur?[st.cur]:[]).forEach(function(a){if(a.p!==st.pg)return;ctx.save();ctx.strokeStyle=ctx.fillStyle=a.c;
   if(a.t==='text'){ctx.font=(a.z*a.k)+'px Helvetica,Arial,sans-serif';ctx.fillText(a.s,a.x,a.y)}
   else if(a.t==='hl'){ctx.globalAlpha=.35;ctx.fillRect(a.x,a.y,a.w,a.h)}
   else if(a.t==='rect'){ctx.lineWidth=1.5*a.k;ctx.strokeRect(a.x,a.y,a.w,a.h)}
   else if(a.t==='pen'){ctx.lineWidth=1.6*a.k;ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();a.pts.forEach(function(q,i){if(i)ctx.lineTo(q[0],q[1]);else ctx.moveTo(q[0],q[1])});ctx.stroke()}
   ctx.restore()})}
 function pos(e){var r=cv.getBoundingClientRect();return [(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]}
 var start=null;cv.style.touchAction='none';
 cv.onpointerdown=function(e){if(!st.base)return;var q=pos(e),c=$('edc').value;
  if(st.tool==='text'){var t=prompt('Type your text');if(t&&t.trim()){st.ann.push({t:'text',p:st.pg,k:st.k,c:c,s:t,z:+$('eds').value,x:q[0],y:q[1]});draw()}return}
  try{cv.setPointerCapture(e.pointerId)}catch(x){}start=q;st.cur=st.tool==='pen'?{t:'pen',p:st.pg,k:st.k,c:c,pts:[q]}:{t:st.tool,p:st.pg,k:st.k,c:c,x:q[0],y:q[1],w:0,h:0}};
 cv.onpointermove=function(e){if(!start||!st.cur)return;var q=pos(e),a=st.cur;
  if(a.t==='pen')a.pts.push(q);else{a.x=Math.min(start[0],q[0]);a.y=Math.min(start[1],q[1]);a.w=Math.abs(q[0]-start[0]);a.h=Math.abs(q[1]-start[1])}draw()};
 cv.onpointerup=function(){if(st.cur){var a=st.cur;if(a.t==='pen'?a.pts.length>1:(a.w>3&&a.h>3))st.ann.push(a)}st.cur=null;start=null;draw()};
 $('edtool').onclick=function(e){var b=e.target.closest('button');if(!b)return;st.tool=b.dataset.t;Array.prototype.forEach.call(this.children,function(x){x.classList.toggle('on',x===b)});var c=$('edc');if(st.tool==='hl')c.value='#facc15';else if(c.value==='#facc15')c.value='#d6453a'};
 $('edu').onclick=function(){st.ann.pop();draw()};
 $('edp').onclick=function(){if(st.pg>1){st.pg--;show()}};
 $('edx').onclick=function(){if(st.pg<st.n){st.pg++;show()}};
 show()}
function render(){
 var t=tools[cur],l=$('list');l.innerHTML='';$('result').hidden=true;
 files.forEach(function(f,i){var li=document.createElement('li');li.innerHTML='<span class="th"></span><span class="n"></span><span class="s"></span>';
  li.children[1].textContent=(t.multi?(i+1)+'. ':'')+f.name;li.children[2].textContent=size(f.size);thumb(f,li.children[0],li.children[2]);
  var a=t.multi?[['↑','Move up',-1],['↓','Move down',1],['✕','Remove',0]]:[['✕','Remove',0]];
  a.forEach(function(x){var b=document.createElement('button');b.className='ic';b.textContent=x[0];b.setAttribute('aria-label',x[1]+' '+f.name);
   b.onclick=function(){if(!x[2])files.splice(i,1);else{var j=i+x[2];if(j<0||j>=files.length)return;var q=files[i];files[i]=files[j];files[j]=q}render()};li.appendChild(b)});
  l.appendChild(li)});
 $('go').textContent=t.n==='Merge PDF'?'Merge PDFs':t.n;$('go').disabled=files.length<t.min;$('clear').hidden=!files.length;
 say(files.length<t.min?(t.min>1?'Add at least '+t.min+' PDF files.':'Add a file to begin.'):'Ready. Set options, then press the button.');hook(t);
}
function add(fl){var t=tools[cur],ok=t.acc.split(','),bad=0,got=[];
 Array.prototype.forEach.call(fl,function(f){var good=ok.indexOf(f.type)>-1||(t.acc===PDFS&&/\.pdf$/i.test(f.name));good?got.push(f):bad++});
 files=t.multi?files.concat(got):got.slice(0,1);render();
 if(bad)say(bad+' file(s) skipped. This tool accepts '+(t.acc===PDFS?'PDF':t.acc==='image/jpeg'?'JPG':t.acc==='image/png'?'PNG':t.acc.indexOf('pdf')>-1?'PDF, JPG and PNG':'JPG and PNG')+' files only.',true)}
var drop=$('drop');
drop.onclick=function(){$('file').click()};
drop.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click()}};
$('file').onchange=function(){add(this.files);this.value=''};
['dragover','dragenter'].forEach(function(v){drop.addEventListener(v,function(e){e.preventDefault();drop.classList.add('over')})});
['dragleave','drop'].forEach(function(v){drop.addEventListener(v,function(e){e.preventDefault();drop.classList.remove('over')})});
drop.addEventListener('drop',function(e){add(e.dataTransfer.files)});
$('clear').onclick=function(){files=[];render()};
$('go').onclick=async function(){
 if(!P()){say('Could not load the PDF library. Check your internet connection and reload.',true);return}
 var t=tools[cur],o={};Array.prototype.forEach.call($('opts').querySelectorAll('[name]'),function(e){o[e.name]=e.type==='checkbox'?e.checked:e.value});
 $('go').disabled=true;say('Working...');
 try{var r=await t.run(files,o),bl=(r&&r.blob)?r.blob:new Blob([r],{type:PDFS}),nm=(r&&r.name)||t.out,u=URL.createObjectURL(bl),dl=$('dl');
  if(dl.dataset.u)URL.revokeObjectURL(dl.dataset.u);dl.dataset.u=dl.href=u;dl.download=nm;dl.textContent='Download '+nm;
  $('result').hidden=false;preview(bl,$('rp'),nm);say('Done. Your file is ready ('+size(bl.size)+').')}
 catch(e){say(/password|encrypt/i.test(e.message)?'This PDF is password protected.':(e.message&&e.message.length<90?e.message:'Could not process this file. It may be damaged.'),true)}
 $('go').disabled=files.length<t.min;
};
function route(){open(location.hash.slice(1)||window.DT||'merge')}
addEventListener('hashchange',route);route();
})();
