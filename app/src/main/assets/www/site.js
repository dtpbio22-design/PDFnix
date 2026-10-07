window.PDFNIX_TOOLS=[["Merge PDF", "merge-pdf", "combine join"], ["Split PDF", "split-pdf", "extract pages"], ["Remove pages", "remove-pages", "delete pages"], ["Rotate PDF", "rotate-pdf", ""], ["Images to PDF", "images-to-pdf", "jpg png image"], ["Add page numbers", "add-page-numbers", ""], ["Add watermark", "add-watermark", ""], ["Rearrange PDF", "rearrange-pages", "reorder"], ["PDF to JPG", "pdf-to-jpg", "convert image"], ["Crop PDF", "crop-pdf", ""], ["Pages per sheet", "pages-per-sheet", "print multiple"], ["Sign PDF", "sign-pdf", "signature"], ["JPG to PDF", "jpg-to-pdf", ""], ["PNG to PDF", "png-to-pdf", ""], ["Change page size", "change-page-size", "a4 resize"], ["Create PDF", "create-pdf", "text to pdf"], ["Create QR code", "qr-code-generator", "qr code link"], ["Compress PDF", "compress-pdf", "reduce size smaller"], ["Repair PDF", "repair-pdf", "fix damaged"], ["PDF to PNG", "pdf-to-png", "convert image"], ["PDF to Text", "pdf-to-text", "extract text"], ["PDF OCR", "pdf-ocr", "scan searchable text"], ["Extract images", "extract-images", "pictures photos"], ["Annotate PDF", "annotate-pdf", "highlight draw comment"], ["Fill out PDF", "fill-out-pdf", "form fields"], ["Webpage to PDF", "", ""], ["Protect PDF", "", ""], ["Unlock PDF", "", ""], ["Redact PDF", "", ""], ["Word to PDF", "", ""], ["PowerPoint to PDF", "", ""], ["Excel to PDF", "", ""], ["HTML to PDF", "", ""], ["PDF to Word", "", ""], ["PDF to PowerPoint", "", ""], ["PDF to Excel", "", ""]];
(function(){
var A=window.PDFNIX_ADS||{};
if(A.showPlaceholders!==false)document.documentElement.classList.add('show-ads');
var tb=document.getElementById('theme');
if(tb)tb.onclick=function(){var t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;try{localStorage.setItem('pdfnix-theme',t)}catch(e){}};
var q=document.getElementById('q'),sr=document.getElementById('sr');if(!q||!sr)return;
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}
function show(){var v=q.value.trim().toLowerCase();if(!v){sr.hidden=true;return}
 var r=window.PDFNIX_TOOLS.filter(function(t){return (t[0]+' '+t[2]).toLowerCase().indexOf(v)>-1}).slice(0,8);
 sr.innerHTML=r.length?r.map(function(t){return t[1]?'<li><a href="'+t[1]+'.html">'+esc(t[0])+'</a></li>':'<li class="soon">'+esc(t[0])+'<small>Coming soon</small></li>'}).join(''):'<li class="soon">No tool found</li>';sr.hidden=false}
q.addEventListener('input',show);q.addEventListener('focus',show);
q.addEventListener('keydown',function(e){if(e.key==='Enter'){var a=sr.querySelector('a');if(a){location.href=a.getAttribute('href')}}if(e.key==='Escape'){sr.hidden=true}});
document.addEventListener('click',function(e){if(!e.target.closest('.sb'))sr.hidden=true});

// Android WebView download bridge
document.addEventListener('click', function(e) {
  var target = e.target.closest('a[download]');
  if (target && target.href && target.href.indexOf('blob:') === 0 && window.Android && window.Android.saveBlob) {
    e.preventDefault();
    fetch(target.href)
      .then(function(res) { return res.blob(); })
      .then(function(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
          var base64 = reader.result.split(',')[1];
          var filename = target.getAttribute('download') || 'document.pdf';
          window.Android.saveBlob(base64, filename, blob.type || 'application/pdf');
        };
        reader.readAsDataURL(blob);
      })
      .catch(function(err) { console.error('Error saving blob in Android:', err); });
  }
});
})();
