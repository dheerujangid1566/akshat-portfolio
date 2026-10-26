(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Three.js particle hero ---------- */
  function initHero() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0B1020, 0.0011);
    const camera = new THREE.PerspectiveCamera(70, 1, 1, 3000);
    camera.position.z = 600;

    const palette = [new THREE.Color('#7C5CFF'), new THREE.Color('#22D3EE'), new THREE.Color('#F472B6')];
    const isMobile = window.innerWidth < 700;
    const COUNT = isMobile ? 2200 : 5000;

    // Galaxy-like spiral of particles
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const arm = i % 3;
      const r = Math.pow(Math.random(), 0.7) * 700;
      const angle = r * 0.006 + (arm / 3) * Math.PI * 2;
      const spread = 60 + r * 0.15;
      positions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.9;
      positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread;
      const c = palette[arm].clone().lerp(palette[(arm + 1) % 3], Math.random() * 0.35);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft round sprite
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(sprite);

    const mat = new THREE.PointsMaterial({
      size: isMobile ? 6 : 5, map: tex, vertexColors: true, transparent: true,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    });
    const galaxy = new THREE.Points(geo, mat);
    galaxy.rotation.x = 0.9;
    scene.add(galaxy);

    // Distant star dust
    const dustCount = isMobile ? 600 : 1500;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i++) dustPos[i] = (Math.random() - 0.5) * 2400;
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 2.5, color: 0x9AA3C7, map: tex, transparent: true, opacity: 0.6, depthWrite: false
    }));
    scene.add(dust);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      galaxy.rotation.y = t * (reduceMotion ? 0 : 0.05);
      dust.rotation.y = -t * 0.01;
      const scrollY = window.scrollY;
      camera.position.x = mouse.x * 80;
      camera.position.y = -mouse.y * 60 - scrollY * 0.15;
      camera.position.z = 600 - Math.min(scrollY, 800) * 0.25;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    tick();
  }

  /* ---------- Typing effect ---------- */
  function initTyped() {
    const el = document.querySelector('.typed');
    if (!el) return;
    const words = JSON.parse(el.dataset.words);
    if (reduceMotion) { el.textContent = words[0]; return; }
    let w = 0, i = 0, deleting = false;
    (function loop() {
      const word = words[w];
      el.textContent = word.slice(0, i);
      if (!deleting && i < word.length) i++;
      else if (deleting && i > 0) i--;
      else if (!deleting) { deleting = true; return setTimeout(loop, 1500); }
      else { deleting = false; w = (w + 1) % words.length; }
      setTimeout(loop, deleting ? 45 : 90);
    })();
  }

  /* ---------- Scroll reveal + counters ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 90}ms`;
        el.classList.add('visible');
        el.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach((el) => io.observe(el));
  }
  function countUp(el) {
    const target = +el.dataset.count;
    const dur = 1600, start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- Nav, progress, active links ---------- */
  function initNav() {
    const nav = document.querySelector('.nav');
    const bar = document.querySelector('.progress');
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    const anchors = [...links.querySelectorAll('a[href^="#"]')];
    const sections = anchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = `${(y / max) * 100}%`;
      let current = '';
      sections.forEach((s) => { if (y + window.innerHeight * 0.35 >= s.offsetTop) current = s.id; });
      anchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    anchors.forEach((a) => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- Cursor glow + card spotlight / tilt ---------- */
  function initPointerFx() {
    if (window.matchMedia('(hover: none)').matches) return;
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    });
    document.querySelectorAll('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', `${x}px`);
        card.style.setProperty('--my', `${y}px`);
        if (!reduceMotion) {
          const rx = ((y / r.height) - 0.5) * -10;
          const ry = ((x / r.width) - 0.5) * 10;
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        }
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Project filters ---------- */
  function initFilters() {
    const buttons = document.querySelectorAll('.filter');
    const projects = document.querySelectorAll('.project');
    buttons.forEach((btn) => btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      const f = btn.dataset.filter;
      projects.forEach((p) => {
        const show = f === 'all' || p.dataset.cat === f;
        p.classList.toggle('hide', !show);
        if (show) { p.classList.remove('visible'); requestAnimationFrame(() => p.classList.add('visible')); }
      });
    }));
  }

  /* ---------- Contact form (demo) ---------- */
  function initForm() {
    const form = document.querySelector('.contact-form');
    const note = form.querySelector('.form-note');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      note.textContent = 'Thanks! Your message is on its way ✨';
      form.reset();
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  initHero();
  initTyped();
  initReveal();
  initNav();
  initPointerFx();
  initFilters();
  initForm();
})();
