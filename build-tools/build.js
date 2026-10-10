const fs = require('fs'), path = require('path'), cp = require('child_process');
const SITE = process.argv[2];
const A = path.join(SITE, 'assets'); fs.mkdirSync(path.join(A, 'fonts'), { recursive: true });
let h = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const must = (s) => { if (!h.includes(s)) throw new Error('not found: ' + s.slice(0, 80)); };

// 1. Tailwind: same theme as the inline CDN config, prebuilt
const cfgStart = h.indexOf('<script>\n    tailwind.config'), cfgEnd = h.indexOf('</script>', cfgStart) + 9;
if (cfgStart < 0) throw new Error('tailwind config not found');
const cfgBody = h.slice(cfgStart, cfgEnd).replace(/^<script>\s*tailwind\.config\s*=\s*/, '').replace(/<\/script>$/, '').trim().replace(/;$/, '');
fs.writeFileSync('tailwind.config.js', `module.exports = Object.assign(${cfgBody}, { content: [${JSON.stringify(path.join(SITE, 'index.html'))}] });`);
fs.writeFileSync('in.css', '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
cp.execSync(`npx tailwindcss -c tailwind.config.js -i in.css -o ${A}/app.css --minify`, { stdio: 'inherit' });
h = h.slice(0, cfgStart) + h.slice(cfgEnd);
must('<script src="https://cdn.tailwindcss.com"></script>');
h = h.replace(/\s*<!-- Tailwind CSS CDN -->/, '').replace('<script src="https://cdn.tailwindcss.com"></script>', '');

// 2. Lucide: only the icons used on the page
const toPascal = (n) => n.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
const L = require('lucide');
const names = [...new Set([...h.matchAll(/data-lucide="([a-z0-9-]+)"/g)].map(m => m[1]))];
const icons = {};
for (const n of names) { const node = L.icons[toPascal(n)]; if (!node) throw new Error('icon missing: ' + n); icons[n] = node; }
fs.writeFileSync(`${A}/icons.js`, `(function(){var I=${JSON.stringify(icons)};
var NS='http://www.w3.org/2000/svg';
function mk(n,node,el){var s=document.createElementNS(NS,'svg');
var a={xmlns:NS,width:24,height:24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'};
for(var k in a)s.setAttribute(k,a[k]);
for(var i=0;i<el.attributes.length;i++){var at=el.attributes[i];if(at.name!=='data-lucide'&&at.name!=='class')s.setAttribute(at.name,at.value);}
s.setAttribute('class',('lucide lucide-'+n+' '+(el.getAttribute('class')||'')).trim());
node.forEach(function(c){var e=document.createElementNS(NS,c[0]);for(var k in c[1])e.setAttribute(k,c[1][k]);s.appendChild(e);});
return s;}
window.lucide={icons:I,createIcons:function(){document.querySelectorAll('[data-lucide]').forEach(function(el){var n=el.getAttribute('data-lucide');if(I[n]&&el.parentNode)el.parentNode.replaceChild(mk(n,I[n],el),el);});}};
})();`);
must('<script src="https://unpkg.com/lucide@latest"></script>');
h = h.replace('<script src="https://unpkg.com/lucide@latest"></script>', '<script src="assets/icons.js"></script>');
console.log('icons', names.length);

// 3. GSAP local
fs.copyFileSync('node_modules/gsap/dist/gsap.min.js', `${A}/gsap.min.js`);
must('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>');
h = h.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>', '<script src="assets/gsap.min.js"></script>');

// 4. Inter font local (latin + cyrillic, 400-900)
let fcss = '';
for (const w of [400, 500, 600, 700, 800, 900]) {
  const css = fs.readFileSync(`node_modules/@fontsource/inter/${w}.css`, 'utf8');
  for (const block of css.split('@font-face').slice(1)) {
    const m = block.match(/inter-(?:latin|cyrillic)-\d+-normal\.woff2/);
    if (!m) continue;
    const f = m[0];
    fs.copyFileSync(`node_modules/@fontsource/inter/files/${f}`, `${A}/fonts/${f}`);
    const body = block.slice(0, block.indexOf('}') + 1).replace(/src:[^;]*;/, `src: url(fonts/${f}) format('woff2');`);
    fcss += '@font-face' + body.trim() + '\n';
  }
}
fs.writeFileSync(`${A}/fonts.css`, fcss);
h = h.replace(/\s*<!-- Google Fonts: Inter -->/, '')
  .replace('<link rel="preconnect" href="https://fonts.googleapis.com">', '')
  .replace('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', '')
  .replace('<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
    '<link rel="preload" href="assets/fonts/inter-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossorigin>\n  <link rel="stylesheet" href="assets/fonts.css">');
if (h.includes('fonts.googleapis.com')) throw new Error('google fonts left');

// Tailwind CDN injected its styles last in <head>; keep that cascade order
h = h.replace('</head>', '  <link rel="stylesheet" href="assets/app.css">\n</head>');

// 5. Images
cp.execSync(`convert ${SITE}/banner2.jpg -resize '1200x>' -strip -quality 80 ${A}/banner2.webp`);
cp.execSync(`convert ${SITE}/images/avatars/avatar_6.png -resize 268x268 -strip -quality 82 ${A}/avatar_6.webp`);
cp.execSync(`convert '${SITE}/images/banners/Casino_10xrate_in_2026032322421.png' -resize '1600x>' -strip -quality 78 ${A}/casino_banner.webp`);
must('src="banner2.jpg"'); h = h.replace('src="banner2.jpg"', 'src="assets/banner2.webp"');
must('src="images/avatars/avatar_6.png"'); h = h.replace('src="images/avatars/avatar_6.png"', 'src="assets/avatar_6.webp"');
h = h.replace(/url\('images\/banners\/Casino_10xrate_in_2026032322421\.png'\),\s*url\('https:\/\/10xrate\.com\/[^']*'\)/, "url('assets/casino_banner.webp')");
if (!h.includes("url('assets/casino_banner.webp')")) throw new Error('casino bg not replaced');

cp.execSync(`convert logo_new.png -resize '600x>' -strip -quality 90 ${A}/logo.webp`);
must('src="https://10xrate.com/images/logo_new.png"');
h = h.replace('src="https://10xrate.com/images/logo_new.png"', 'src="assets/logo.webp"');

// 6. External game GIFs: load only when their slide is shown
let n = 0;
h = h.replace(/<img([^>]*?) src="(https:\/\/10xrate\.com\/images\/gif\/[^"]+)"/g, (m, pre, src) => { n++; return `<img${pre} data-src="${src}"`; });
console.log('deferred gifs', n);
h = h.replace('</body>', `  <script>
    (function () {
      function load(slide) {
        if (!slide) return;
        slide.querySelectorAll('img[data-src]').forEach(function (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); });
      }
      function check() {
        var a = document.querySelector('.slide.active');
        if (a) { load(a); var s = a.nextElementSibling; while (s && !(s.classList && s.classList.contains('slide'))) s = s.nextElementSibling; load(s); }
      }
      document.addEventListener('DOMContentLoaded', function () {
        check();
        document.querySelectorAll('.slide').forEach(function (s) {
          new MutationObserver(check).observe(s, { attributes: true, attributeFilter: ['class'] });
        });
      });
    })();
  </script>
</body>`);
fs.writeFileSync(path.join(SITE, 'index.html'), h);
console.log('done');
