(function () {
      var $ = function (id) { return document.getElementById(id) };
      var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var fine = matchMedia('(pointer:fine)').matches;

      /* Foto profil */
      /* Foto profil: isi FOTO dengan alamat gambar (misalnya 'foto.jpg') atau data URI. Kosong = tampil inisial. */
      var FOTO = 'poto.png';
      var img = $('photo'), ini = $('ini');
      function show(s) { img.src = s; img.hidden = false; ini.hidden = true }
      if (FOTO) show(FOTO);


      var W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      var bar = $('bar');
      var dot = $('dot'), ring = $('ring'), rlabel = ring.querySelector('span');
      var mx = -999, my = -999, rx = -999, ry = -999;
      var pcard = $('pcard'), tx = 0, ty = 0, tX = 0, tY = 0;

      addEventListener('pointermove', function (e) {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
        if (fine) {
          tx = mx / W - .5;
          ty = my / H - .5;
        }
      }, { passive: true });

      addEventListener('pointerover', function (e) {
        var target = e.target.closest ? e.target.closest('[data-cur],a,label,.mq span') : null;
        ring.classList.toggle('hot', !!target);
        var label = target && target.dataset.cur || '';
        ring.classList.toggle('lbl', !!label);
        rlabel.textContent = label;
      });

      addEventListener('pointerdown', function () { ring.classList.add('down') });
      addEventListener('pointerup', function () { ring.classList.remove('down') });

      /* Blob 3D */
      var gl = $('gl'), renderer, scene, camera, blob, orbit, U, amp = .5;
      if (window.THREE) {
        renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, .1, 50); camera.position.z = 6.5;
        U = { uTime: { value: 0 }, uAmp: { value: .5 }, uL: { value: new THREE.Vector3(0, .5, 1) } };
        var vs = [
          'uniform float uTime,uAmp;varying vec3 vN,vV;varying float vH;',
          'float hs(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
          'float nz(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
          'return mix(mix(mix(hs(i),hs(i+vec3(1,0,0)),f.x),mix(hs(i+vec3(0,1,0)),hs(i+vec3(1,1,0)),f.x),f.y),',
          'mix(mix(hs(i+vec3(0,0,1)),hs(i+vec3(1,0,1)),f.x),mix(hs(i+vec3(0,1,1)),hs(i+vec3(1,1,1)),f.x),f.y),f.z);}',
          'void main(){vec3 q=position*1.1+uTime*.3;float n=nz(q);',
          'vec3 g=vec3(nz(q+vec3(.1,0,0))-n,nz(q+vec3(0,.1,0))-n,nz(q+vec3(0,0,.1))-n)*10.;',
          'vec3 p=position*(1.+(n-.5)*uAmp);vec3 N=normalize(normal-g*uAmp*.35);',
          'vN=normalize(normalMatrix*N);vec4 mv=modelViewMatrix*vec4(p,1.);vV=-mv.xyz;vH=n;gl_Position=projectionMatrix*mv;}'
        ].join('\n');
        var fs = [
          'uniform vec3 uL;varying vec3 vN,vV;varying float vH;',
          'void main(){vec3 N=normalize(vN),V=normalize(vV),L=normalize(uL),acc=vec3(.647,.706,.988);',
          'float fr=pow(1.-clamp(dot(N,V),0.,1.),2.2);float df=clamp(dot(N,L),0.,1.);',
          'float sp=pow(clamp(dot(N,normalize(L+V)),0.,1.),48.);',
          'float c=abs(fract(vH*7.)-.5);',
          'vec3 col=vec3(.035,.035,.055)+acc*df*.1+acc*fr*.95+acc*smoothstep(.46,.5,c)*.14+vec3(.9,.92,1.)*sp*.55;',
          'gl_FragColor=vec4(col,1.);}'
        ].join('\n');
        blob = new THREE.Mesh(new THREE.SphereGeometry(1.6, 80, 80), new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs }));
        orbit = new THREE.Mesh(new THREE.TorusGeometry(2.5, .006, 6, 160), new THREE.MeshBasicMaterial({ color: 0xa5b4fc, transparent: true, opacity: .45 }));
        orbit.rotation.x = 1.25; blob.add(orbit); scene.add(blob);
        var dpos = new Float32Array(300 * 3);
        for (var dk = 0; dk < 300; dk++) { var dr = 2.2 + Math.random() * 1.8, da = Math.random() * 6.283, db = Math.acos(2 * Math.random() - 1); dpos[dk * 3] = dr * Math.sin(db) * Math.cos(da); dpos[dk * 3 + 1] = dr * Math.sin(db) * Math.sin(da); dpos[dk * 3 + 2] = dr * Math.cos(db); }
        var dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
        blob.add(new THREE.Points(dgeo, new THREE.PointsMaterial({ color: 0xa5b4fc, size: .025, transparent: true, opacity: .7 })));
      }

      /* Canvas 2D: partikel */
      var c = $('fx'), g = c.getContext('2d'), P = [];
      function size() {
        W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (renderer) { renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
        P = []; var n = W < 700 ? 26 : 56;
        for (var i = 0; i < n; i++) {
          var a = Math.random() * 6.283, s = .15 + Math.random() * .25;
          P.push({ x: Math.random() * W, y: Math.random() * H, bx: Math.cos(a) * s, by: Math.sin(a) * s, vx: 0, vy: 0 });
        }
      }
      addEventListener('resize', size); size();

      var navs = [].slice.call(document.querySelectorAll('nav a'));
      setTimeout(function () { document.querySelector('h1').classList.add('free') }, 1400);
      function tick() { var t = new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }); $('clock').textContent = t.replace('.', ':') + ' WIB' }
      tick(); setInterval(tick, 15000);
      var cp = $('copy');
      cp.addEventListener('click', function () {
        var set = function (t) { cp.textContent = t; setTimeout(function () { cp.textContent = 'Salin email' }, 1800) };
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText('halo@contoh.com').then(function () { set('Tersalin!') }, function () { set('Gagal menyalin') }) } else { set('Gagal menyalin') }
      });
      var clock = window.THREE ? new THREE.Clock() : null;
      function frame() {
        var i, j, p, q, d, sy = scrollY, s = Math.min(sy / (H * .9), 1), wide = W > 860;
        if (fine) {
          rx += (mx - rx) * .18;
          ry += (my - ry) * .18;
          ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
        }
        tX += (tx - tX) * .07;
        tY += (ty - tY) * .07;
        pcard.style.transform = 'rotateY(' + (tX * 14) + 'deg) rotateX(' + (-tY * 12) + 'deg)';
        bar.style.transform = 'scaleX(' + (sy / Math.max(document.documentElement.scrollHeight - H, 1)) + ')';
        var cur = 'atas';['tentang', 'pendidikan', 'prestasi', 'proyek', 'kontak'].forEach(function (id) { var el = $(id); if (el && el.getBoundingClientRect().top < H * .4) cur = id });
        navs.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur) });

        if (renderer) {
          var t = reduce ? 0 : clock.getElapsedTime();
          amp = .5 + (reduce ? 0 : Math.sin(t * .7) * .12);
          U.uTime.value = t; U.uAmp.value = amp;
          U.uL.value.set(tX * 2.4, -tY * 2.4, 1.2);
          blob.rotation.y = t * .12 + tX * .8; blob.rotation.x = tY * .5;
          orbit.rotation.z = t * .15;
          blob.position.x = wide ? 2.2 : 0;
          blob.position.y = (wide ? 0 : 1.1) + s * 1.4;
          blob.scale.setScalar((wide ? 1 : .75) * (1 - .3 * s));
          gl.style.opacity = (wide ? 1 : .65) * (1 - .8 * s);
          renderer.render(scene, camera);
        }

        g.clearRect(0, 0, W, H);
        for (i = 0; i < P.length; i++) {
          p = P[i];
          p.vx = p.vx * .95 + p.bx * .05; p.vy = p.vy * .95 + p.by * .05; p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        }
        g.lineWidth = 1;
        for (i = 0; i < P.length; i++) {
          p = P[i];
          for (j = i + 1; j < P.length; j++) {
            q = P[j]; d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < 110) { g.strokeStyle = 'rgba(165,180,252,' + (1 - d / 110) * .18 + ')'; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); }
          }
          g.fillStyle = 'rgba(205,207,215,.5)'; g.beginPath(); g.arc(p.x, p.y, 1.5, 0, 6.283); g.fill();
        }
      }

      var run = true;
      function loop() { if (!run) return; frame(); requestAnimationFrame(loop) }
      document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(loop) });
      if (reduce) { frame() } else { requestAnimationFrame(loop) }
    })();
