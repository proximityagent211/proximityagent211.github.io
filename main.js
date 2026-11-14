/* ProximityAgent — interactions */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(devicePixelRatio || 1, 2);
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };

/* ---------- loader ---------- */
const ready = () => { $('#loader').classList.add('done'); document.body.classList.add('ready'); };
window.addEventListener('load', () => setTimeout(ready, 350));
setTimeout(ready, 3000);

/* ---------- header / burger ---------- */
const hdr = $('#hdr'), nav = $('#nav'), burger = $('#burger');
const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true }); onScroll();
burger.addEventListener('click', () => { burger.classList.toggle('open'); nav.classList.toggle('open'); });
$$('#nav a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('open'); nav.classList.remove('open'); }));

/* ---------- custom cursor ---------- */
const cur = $('.cur'), dot = $('.cur-dot');
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  let cx = mouse.x, cy = mouse.y;
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; dot.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`; });
  (function loop() { cx += (mouse.x - cx) * .18; cy += (mouse.y - cy) * .18; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => cur.classList.toggle('hover', !!e.target.closest('a,button,input[type=range],.tog')));
} else addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, { passive: true });

/* ---------- starfield ---------- */
const sc = $('#stars'), sx = sc.getContext('2d');
let stars = [];
function sizeStars() {
  sc.width = innerWidth * DPR; sc.height = innerHeight * DPR;
  sc.style.width = innerWidth + 'px'; sc.style.height = innerHeight + 'px';
  const n = Math.round(innerWidth * innerHeight / 5200);
  stars = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * .9 + .1, t: Math.random() * 6.28 }));
}
sizeStars(); addEventListener('resize', sizeStars);
function drawStars(time) {
  sx.clearRect(0, 0, sc.width, sc.height);
  const px = (mouse.x / innerWidth - .5), py = (mouse.y / innerHeight - .5), sy = scrollY * .00004;
  for (const s of stars) {
    const x = ((s.x - px * .02 * s.z) % 1 + 1) % 1 * sc.width;
    const y = ((s.y - py * .02 * s.z - sy * s.z * 4) % 1 + 1) % 1 * sc.height;
    const a = (.25 + .55 * s.z) * (reduce ? 1 : .65 + .35 * Math.sin(time * .0012 + s.t));
    sx.fillStyle = `rgba(255,255,255,${a})`;
    const r = s.z * 1.1 * DPR;
    sx.fillRect(x, y, r, r);
  }
}

/* ---------- orbit system (hero) ---------- */
const oc = $('#orbit'), ox = oc.getContext('2d'), ow = $('#orbitWrap');
let OW = 0;
const TILT = -16 * Math.PI / 180;
const orbits = [
  { rx: .47, ry: .115, speed: .00016, dash: [2, 7], alpha: .45, sats: [{ p: 0, r: 3.2, label: 'Боты' }, { p: Math.PI, r: 2 }] },
  { rx: .60, ry: .16, speed: -.0001, dash: [], alpha: .18, sats: [{ p: 1.4, r: 2.6, label: 'Сайты' }, { p: 4.2, r: 1.6 }] },
  { rx: .38, ry: .44, speed: .00022, dash: [1, 10], alpha: .22, rot: 58, sats: [{ p: 2.5, r: 2.4, label: 'Парсинг' }] },
  { rx: .70, ry: .2, speed: .00007, dash: [1, 14], alpha: .12, rot: -6, sats: [{ p: 5.1, r: 2, label: 'Автоматизация' }] },
];
const labels = orbits.flatMap(o => o.sats.filter(s => s.label)).map(s => {
  const el = document.createElement('span'); el.className = 'orbit-label'; el.textContent = s.label; ow.appendChild(el); s.el = el; return s;
});
function sizeOrbit() {
  OW = ow.clientWidth; const s = OW * 1.24;
  oc.width = s * DPR; oc.height = s * DPR;
}
sizeOrbit(); addEventListener('resize', sizeOrbit);
let tiltX = 0, tiltY = 0;
function drawOrbit(t) {
  const W = OW, S = W * 1.24, k = DPR;
  ox.setTransform(k, 0, 0, k, 0, 0); ox.clearRect(0, 0, S, S);
  // planet centre in canvas coords (image disc at ~52%/49% of the picture)
  const r = ow.getBoundingClientRect();
  tiltX += (((mouse.x - r.left) / r.width - .5) - tiltX) * .05;
  tiltY += (((mouse.y - r.top) / r.height - .5) - tiltY) * .05;
  const cx = W * .12 + W * .52 + tiltX * 10, cy = W * .12 + W * .49 + tiltY * 10, pr = W * .255;
  const items = [];
  for (const o of orbits) {
    const rot = TILT + (o.rot || 0) * Math.PI / 180;
    const rx = o.rx * W, ry = o.ry * W * (1 + tiltY * .25);
    // back half (behind planet) and front half drawn separately
    for (const half of [0, 1]) {
      ox.save(); ox.translate(cx, cy); ox.rotate(rot);
      ox.beginPath(); ox.ellipse(0, 0, rx, ry, 0, half ? 0 : Math.PI, half ? Math.PI : Math.PI * 2);
      ox.restore();
      ox.save();
      if (!half) { ox.beginPath(); ox.rect(0, 0, S, S); ox.arc(cx, cy, pr, 0, Math.PI * 2, true); ox.clip('evenodd'); }
      ox.save(); ox.translate(cx, cy); ox.rotate(rot);
      ox.beginPath(); ox.ellipse(0, 0, rx, ry, 0, half ? 0 : Math.PI, half ? Math.PI : Math.PI * 2);
      ox.restore();
      ox.setLineDash(o.dash); ox.lineDashOffset = -t * .01;
      ox.strokeStyle = `rgba(255,255,255,${o.alpha * (half ? 1 : .55)})`; ox.lineWidth = 1; ox.stroke();
      ox.restore();
    }
    for (const s of o.sats) {
      const a = s.p + (reduce ? 0 : t * o.speed);
      const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
      const x = cx + ex * Math.cos(rot) - ey * Math.sin(rot);
      const y = cy + ex * Math.sin(rot) + ey * Math.cos(rot);
      const front = Math.sin(a) > 0;
      const hidden = !front && Math.hypot(x - cx, y - cy) < pr;
      items.push({ x, y, s, front, hidden, a, o, rx, ry, rot });
    }
  }
  // satellites with trails
  for (const it of items) {
    if (it.hidden) { if (it.s.el) it.s.el.style.opacity = 0; continue; }
    const { x, y, s, front } = it;
    // trail
    for (let i = 1; i <= 14; i++) {
      const a2 = it.a - Math.sign(it.o.speed) * i * .025;
      const ex = Math.cos(a2) * it.rx, ey = Math.sin(a2) * it.ry;
      const tx = cx + ex * Math.cos(it.rot) - ey * Math.sin(it.rot), ty = cy + ex * Math.sin(it.rot) + ey * Math.cos(it.rot);
      if (Math.sin(a2) < 0 && Math.hypot(tx - cx, ty - cy) < pr) continue;
      ox.fillStyle = `rgba(255,255,255,${(1 - i / 15) * .35 * (front ? 1 : .5)})`;
      ox.beginPath(); ox.arc(tx, ty, s.r * (1 - i / 18), 0, 7); ox.fill();
    }
    const g = ox.createRadialGradient(x, y, 0, x, y, s.r * 6);
    g.addColorStop(0, `rgba(255,255,255,${front ? .5 : .2})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ox.fillStyle = g; ox.beginPath(); ox.arc(x, y, s.r * 6, 0, 7); ox.fill();
    ox.fillStyle = front ? '#fff' : 'rgba(255,255,255,.55)';
    ox.beginPath(); ox.arc(x, y, s.r * (front ? 1 : .8), 0, 7); ox.fill();
    if (s.el) {
      s.el.style.opacity = front ? 1 : .35;
      s.el.style.left = (x - W * .12 + 12) + 'px'; s.el.style.top = (y - W * .12 - 30) + 'px';
    }
  }
  // flare that sweeps around the rim
  const fa = -0.9 + Math.sin(t * .0004) * .35;
  const fx = cx + Math.cos(fa) * pr, fy = cy + Math.sin(fa) * pr;
  const fg = ox.createRadialGradient(fx, fy, 0, fx, fy, W * .08);
  fg.addColorStop(0, 'rgba(255,255,255,.55)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
  ox.fillStyle = fg; ox.beginPath(); ox.arc(fx, fy, W * .08, 0, 7); ox.fill();
  ow.style.transform = `perspective(1200px) rotateY(${tiltX * 6}deg) rotateX(${-tiltY * 6}deg)`;
}

/* ---------- contact orbit (background) ---------- */
const cc = $('#cOrbit'), cxx = cc.getContext('2d');
function sizeC() { const r = cc.getBoundingClientRect(); cc.width = r.width * DPR; cc.height = r.height * DPR; }
sizeC(); addEventListener('resize', sizeC);
function drawContact(t) {
  const w = cc.width / DPR, h = cc.height / DPR;
  cxx.setTransform(DPR, 0, 0, DPR, 0, 0); cxx.clearRect(0, 0, w, h);
  const ox_ = w * .92, oy = h * .1;
  for (let i = 1; i <= 6; i++) {
    const R = i * Math.max(w, h) * .16;
    cxx.strokeStyle = `rgba(255,255,255,${.09 - i * .01})`; cxx.lineWidth = 1;
    cxx.beginPath(); cxx.arc(ox_, oy, R, 0, 7); cxx.stroke();
    const a = t * .00015 * (i % 2 ? 1 : -1) / i * 3 + i;
    cxx.fillStyle = 'rgba(255,255,255,.7)';
    cxx.beginPath(); cxx.arc(ox_ + Math.cos(a) * R, oy + Math.sin(a) * R, 1.8, 0, 7); cxx.fill();
  }
}

/* ---------- main loop (only draw visible parts) ---------- */
const vis = new Map();
const io = new IntersectionObserver(es => es.forEach(e => vis.set(e.target, e.isIntersecting)));
[ow, cc].forEach(el => io.observe(el));
function frame(t) {
  drawStars(t);
  if (vis.get(ow)) drawOrbit(t);
  if (vis.get(cc)) drawContact(t);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- reveal + counters ---------- */
const rio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); rio.unobserve(e.target);
}), { threshold: .15 });
$$('.rv').forEach(el => rio.observe(el));
$$('[data-count]').forEach(el => {
  const end = +el.dataset.count; let n = 0;
  const step = () => { n++; el.textContent = n; if (n < end) setTimeout(step, 1200 / end); };
  setTimeout(step, 900);
});

/* ---------- service card spotlight ---------- */
$$('.s-card').forEach(c => c.addEventListener('mousemove', e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px');
}));

/* ---------- parser demo table ---------- */
const goods = [['Наушники TWS Pro', 2990, '+4%'], ['Кофемашина капсульная', 8490, '−7%'], ['Пылесос вертикальный', 12990, '−3%'], ['Смарт-часы S8', 4590, '+2%'], ['Чайник стеклянный', 1690, '0%'], ['Увлажнитель воздуха', 2290, '−11%'], ['Кресло игровое', 15990, '+6%']];
const sheet = $('#sheet'); let gi = 0;
function addRow() {
  if (gi >= goods.length) { $$('.r:not(.hd)', sheet).forEach(r => r.remove()); $('.st', sheet)?.remove(); gi = 0; }
  const [n, p, d] = goods[gi++];
  const row = document.createElement('div'); row.className = 'r new';
  row.innerHTML = `<span class="n">${gi}</span><span>${n}</span><span>${p.toLocaleString('ru')} ₽</span><span class="${d.startsWith('+') ? 'up' : 'dn'}">${d}</span>`;
  sheet.appendChild(row);
  let st = $('.st', sheet); if (!st) { st = document.createElement('div'); st.className = 'st'; }
  st.innerHTML = `<span>Собрано: <b>${gi * 143}</b> позиций</span><span>● обновлено сейчас</span>`; sheet.appendChild(st);
}
for (let i = 0; i < 4; i++) addRow();
setInterval(addRow, 1600);

/* ---------- works slider ---------- */
const slides = $('#slides'), vp = $('#vp'), N = slides.children.length, dots = $('#dots');
let idx = 0, timer;
for (let i = 0; i < N; i++) { const b = document.createElement('button'); b.setAttribute('aria-label', 'Слайд ' + (i + 1)); b.onclick = () => go(i); dots.appendChild(b); }
function go(i) {
  idx = (i + N) % N;
  slides.style.transform = `translateX(${-idx * 100}%)`;
  $$('button', dots).forEach((b, j) => b.classList.toggle('on', j === idx));
  $('#cn').textContent = String(idx + 1).padStart(2, '0');
  // replay chat animation
  const s = slides.children[idx];
  $$('.msg,.kb', s).forEach(m => { m.style.animation = 'none'; m.offsetHeight; m.style.animation = ''; });
  clearInterval(timer); timer = setInterval(() => go(idx + 1), 7000);
}
$('#prev').onclick = () => go(idx - 1); $('#next').onclick = () => go(idx + 1);
let sx0 = null, dx = 0;
vp.addEventListener('pointerdown', e => { sx0 = e.clientX; dx = 0; vp.classList.add('drag'); slides.style.transition = 'none'; });
addEventListener('pointermove', e => { if (sx0 === null) return; dx = e.clientX - sx0; slides.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`; });
addEventListener('pointerup', () => {
  if (sx0 === null) return; sx0 = null; vp.classList.remove('drag'); slides.style.transition = '';
  if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1)); else go(idx);
});
vp.addEventListener('mouseenter', () => clearInterval(timer));
vp.addEventListener('mouseleave', () => go(idx));
go(0);

/* ---------- calculator ---------- */
const P = {
  bot:   { base: 500,  name: 'Telegram-бот', cx: 'Сложность сценария', days: [1, 2, 3, 4, 5] },
  ai:    { base: 1000, name: 'Бот с ИИ', cx: 'Объём базы знаний', days: [2, 2, 3, 4, 6] },
  land:  { base: 1000, name: 'Лендинг', cx: 'Количество блоков', days: [1, 2, 3, 4, 5] },
  app:   { base: 1000, name: 'Mini App', cx: 'Количество экранов', days: [2, 3, 4, 5, 7] },
  pars:  { base: 300,  name: 'Парсер', cx: 'Сложность сайта', days: [1, 1, 2, 3, 4] },
  auto:  { base: 300,  name: 'Скрипт', cx: 'Объём задачи', days: [1, 1, 2, 3, 4] },
  sheet: { base: 200,  name: 'Таблицы', cx: 'Сложность расчётов', days: [1, 1, 1, 2, 3] },
  fix:   { base: 300,  name: 'Исправление кода', cx: 'Объём правок', days: [1, 1, 2, 2, 3] },
};
const CX = ['Минимальная', 'Простая', 'Средняя', 'Выше средней', 'Сложная'];
const SP = ['Не горит', 'Стандартный', 'Срочно'];
const OPT = [['o1', 'Запуск на сервере', 200], ['o2', 'Google Таблицы', 300], ['o3', 'Поддержка 30 дней', 400]];
let type = 'bot', shown = 0;
const fmt = n => Math.round(n).toLocaleString('ru');
const dayWord = n => n % 10 === 1 && n % 100 !== 11 ? 'день' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'дня' : 'дней';
function paint(r) { r.style.setProperty('--p', (r.value - r.min) / (r.max - r.min) * 100 + '%'); }
function calc() {
  const p = P[type], cx = +$('#cx').value, sp = +$('#sp').value;
  const work = Math.round(p.base * (1 + .25 * (cx - 1)) / 100) * 100;
  const k = [.9, 1, 1.3][sp - 1];
  let total = Math.round(work * k / 100) * 100;
  const rows = [[p.name + ' · ' + CX[cx - 1].toLowerCase(), work]];
  if (k !== 1) rows.push([sp === 3 ? 'Срочность' : 'Скидка за гибкий срок', total - work]);
  OPT.forEach(([id, n, v]) => { if ($('#' + id).checked) { total += v; rows.push([n, v]); } });
  let d = p.days[cx - 1]; d = sp === 1 ? d + 1 : sp === 3 ? Math.max(1, Math.ceil(d * .6)) : d;
  $('#cxLbl').textContent = p.cx; $('#cxVal').textContent = CX[cx - 1]; $('#spVal').textContent = SP[sp - 1];
  $('#days').textContent = `${d} ${dayWord(d)}`;
  $('#brk').innerHTML = rows.map(([n, v]) => `<li><span>${n}</span><span>${v > 0 ? '' : '−'}${fmt(Math.abs(v))} ₽</span></li>`).join('');
  const from = shown, t0 = performance.now();
  (function anim(now) { const q = Math.min(1, (now - t0) / 500), e = 1 - Math.pow(1 - q, 3); shown = from + (total - from) * e; $('#tot').textContent = fmt(shown); if (q < 1) requestAnimationFrame(anim); })(t0);
  $('#calcGo').dataset.msg = `${p.name}, ${CX[cx - 1].toLowerCase()} сложность, срок ${SP[sp - 1].toLowerCase()}, ~${fmt(total)} ₽`;
}
$$('#ctype button').forEach(b => b.onclick = () => { $$('#ctype button').forEach(x => x.classList.remove('on')); b.classList.add('on'); type = b.dataset.v; calc(); });
$$('input[type=range]').forEach(r => { paint(r); r.addEventListener('input', () => { paint(r); calc(); }); });
OPT.forEach(([id]) => $('#' + id).addEventListener('change', calc));
$('#calcGo').addEventListener('click', () => { const t = $('#ft'); if (!t.value) t.value = 'Расчёт: ' + $('#calcGo').dataset.msg; });
calc();

/* ---------- FAQ ---------- */
$$('.qa button').forEach(b => b.onclick = () => {
  const q = b.parentElement, open = q.classList.contains('open');
  $$('.qa').forEach(x => x.classList.remove('open')); if (!open) q.classList.add('open');
});

/* ---------- contact form (opens prepared email) ---------- */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, name = f.name.value.trim(), contact = f.contact.value.trim();
  if (!name || !contact) { (!name ? f.name : f.contact).focus(); return; }
  const body = `Имя: ${name}\nКонтакт: ${contact}\n\n${f.task.value.trim()}`;
  f.classList.add('sent');
  setTimeout(() => { location.href = `mailto:proximityagent.dev@gmail.com?subject=${encodeURIComponent('Заявка с сайта — ' + name)}&body=${encodeURIComponent(body)}`; }, 900);
});

/* ---------- v6: service filter ---------- */
$$('#svcTabs button').forEach(b => b.addEventListener('click', () => {
  $$('#svcTabs button').forEach(x => x.classList.toggle('on', x === b));
  const f = b.dataset.f;
  $$('#svcGrid .s-card').forEach(c => {
    const show = f === 'all' || c.dataset.cat === f;
    c.classList.toggle('hide', !show);
    if (show) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop', 'in'); }
  });
}));

/* ---------- prefill form from services / packages ---------- */
const prefill = txt => { const t = $('#ft'); if (t && !t.value) t.value = txt; };
$$('[data-svc]').forEach(c => c.addEventListener('click', () => prefill('Услуга: ' + c.dataset.svc + '. ')));
$$('[data-pkg]').forEach(c => c.addEventListener('click', () => prefill('Формат: ' + c.dataset.pkg + '. ')));

/* ---------- mobile sticky CTA ---------- */
const mCta = $('#mCta');
if (mCta) {
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (e.target.id === 'contact') mCta.dataset.c = e.isIntersecting ? '1' : '';
    else mCta.dataset.h = e.isIntersecting ? '1' : '';
    mCta.classList.toggle('show', !mCta.dataset.h && !mCta.dataset.c);
  }), { threshold: .1 });
  cio.observe($('.hero')); cio.observe($('#contact'));
}
})();
