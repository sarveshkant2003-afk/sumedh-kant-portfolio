/* ==========================================================================
   Sumedh Kant: page behaviour. The engine pins the acts; everything bespoke
   lives here, driven from each act's own scroll progress.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.SK_DATA || { reel: [], bin: [] };
  var doc = document, root = doc.documentElement;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var FPS = 25;
  function clamp(v, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return v < a ? a : v > b ? b : v; }
  function ss(a, b, x) { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tc(sec) {
    var f = Math.max(0, Math.round(sec * FPS));
    var ff = f % FPS, s = Math.floor(f / FPS);
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(ff);
  }
  function mmss(s) { return Math.floor(s / 60) + ':' + pad(Math.round(s % 60)); }
  // Progress of a pinned act, the same formula the engine uses.
  function prog(el) {
    var r = el.getBoundingClientRect(), t = r.height - innerHeight;
    return t > 1 ? clamp(-r.top / t) : (r.top < 0 ? 1 : 0);
  }
  function onScreen(el, margin) {
    var r = el.getBoundingClientRect(); margin = margin || 0;
    return r.bottom > -margin && r.top < innerHeight + margin;
  }

  /* -------------------------------------------------------------- theme -- */
  var themeBtn = $('#theme');
  function setTheme(t, save) {
    root.dataset.theme = t;
    themeBtn.setAttribute('aria-checked', t === 'dark' ? 'true' : 'false');
    if (save) { try { localStorage.setItem('sk-theme', t); } catch (e) {} }
  }
  setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', false);
  themeBtn.addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true); });

  /* ---------------------------------------------------------------- OSD -- */
  var osd = $('.osd'), osdScene = $('#osd-scene'), osdTc = $('#osd-tc');
  var playBtn = $('.osd__play'), chapters = $('#chapters');
  var scenes = $$('[data-scene]');
  var chapterLinks = $$('#chapters a');
  function setMenu(open) {
    chapters.hidden = !open;
    playBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  playBtn.addEventListener('click', function () { setMenu(chapters.hidden); });
  chapterLinks.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !chapters.hidden) { setMenu(false); playBtn.focus(); }
  });
  doc.addEventListener('click', function (e) {
    if (!chapters.hidden && !e.target.closest('.osd__menu')) setMenu(false);
  });
  var lastScene = '';
  function osdTick() {
    var mid = innerHeight * 0.5, top = 34, name = lastScene, ground = 'paper';
    for (var i = 0; i < scenes.length; i++) {
      var r = scenes[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) name = scenes[i].dataset.scene;
      if (r.top <= top && r.bottom > top) ground = scenes[i].dataset.ground;
    }
    // the film strip is dark but sits mid-screen; the header over it is paper
    osd.dataset.ground = ground;
    if (name !== lastScene) {
      lastScene = name; osdScene.textContent = name;
      chapterLinks.forEach(function (a) { a.setAttribute('aria-current', a.textContent === name ? 'true' : 'false'); });
    }
    // Page position as a timecode: four seconds a screen.
    osdTc.textContent = tc(scrollY / innerHeight * 4);
  }

  /* --------------------------------------------------------------- hero -- */
  var hero = $('#top');
  var H = {
    sky: $('.pl--sky'), mtn: $('.pl--mtn'), me: $('.pl--me'), mist: $('.pl--mist'),
    band: $('.hero__band'), next: $('.next'), line: $('.hero__line'), beat: $('.hero__beat'),
    role: $('.hero__role')
  };
  var mx = 0, my = 0, tmx = 0, tmy = 0;
  if (FINE && !RM) {
    addEventListener('pointermove', function (e) {
      tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }
  function heroTick() {
    if (!onScreen(hero)) return;
    var p = prog(hero), narrow = innerWidth <= 860;
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    if (!RM) {
      // Back to front: sky barely moves, the ridge climbs, he steps closer, mist passes.
      H.sky.style.transform = 'translate3d(' + (mx * -8).toFixed(2) + 'px,' + (my * -5 + p * 10).toFixed(2) + 'px,0) scale(' + (1.04 + p * 0.05).toFixed(4) + ')';
      H.mtn.style.transform = 'translate3d(' + (mx * -16).toFixed(2) + 'px,0,0) scale(' + (1.04 + p * 0.16).toFixed(4) + ')';
      H.me.style.transform = 'translate3d(' + (mx * -26).toFixed(2) + 'px,' + (my * -6).toFixed(2) + 'px,0) scale(' + (1 + p * 0.07).toFixed(4) + ')';
      H.mist.style.transform = 'translate3d(' + (-30 + p * 150 + mx * -44).toFixed(2) + 'px,' + (-p * 36).toFixed(2) + 'px,0)';
      if (!narrow) H.band.style.setProperty('--band-inset', ((1 - ss(0.08, 0.7, p)) * 2.5).toFixed(3) + 'vw');
    }
    // Second beat: the aside steps back, and he says hello.
    var out = 1 - ss(0.18, 0.42, p), inn = ss(0.42, 0.7, p);
    H.next.style.opacity = out.toFixed(3);
    H.line.style.opacity = out.toFixed(3);
    if (narrow) H.role.style.opacity = out.toFixed(3); else H.role.style.opacity = '';
    H.next.style.visibility = out < 0.02 ? 'hidden' : '';
    H.beat.style.opacity = inn.toFixed(3);
    H.beat.style.transform = RM ? '' : 'translate3d(0,' + ((1 - inn) * 14).toFixed(2) + 'px,0)';
  }

  /* ----------------------------------------------------------- edit bay -- */
  var bay = $('#work');
  var R = D.reel, LEAD = 1.5, END = LEAD;
  R.forEach(function (c) { c.t0 = END; END += c.dur; });
  var mon = $('#monitor'), leader = $('#leader'), leaderN = $('#leader-n');
  var track = $('#tl-track'), lanes = $('#tl-lanes');
  var v1 = $('#tl-v1'), v2 = $('#tl-v2'), a1 = $('#tl-a1'), ruler = $('#tl-ruler');
  var bayTc = $('#bay-tc'), shuttle = $('#bay-shuttle');
  var insp = $('#insp'), inspLead = $('#insp-lead'), inspClip = $('#insp-clip');
  $('#bay-dur').textContent = tc(END);

  var cutEls = [], PPS = 120, PH = 0.26;
  function buildTimeline() {
    var cs = getComputedStyle($('.tl'));
    PPS = parseFloat(cs.getPropertyValue('--pps')) || 120;
    PH = (parseFloat(cs.getPropertyValue('--ph')) || 26) / 100;
    var P = PPS;
    [v1, v2, a1, ruler].forEach(function (l) { l.innerHTML = ''; });
    cutEls = [];
    track.style.width = Math.ceil((END + 12) * P) + 'px';
    for (var s = 0; s <= Math.ceil(END + 10); s++) {
      var t = doc.createElement('div');
      var major = s % 5 === 0;
      t.className = 'tl__tick' + (major ? ' tl__tick--major' : '');
      t.style.left = (s * P) + 'px';
      if (major) { var lab = doc.createElement('span'); lab.textContent = tc(s); t.appendChild(lab); }
      ruler.appendChild(t);
    }
    var ld = doc.createElement('div');
    ld.className = 'v1 v1--lead';
    ld.style.left = '0px'; ld.style.width = (LEAD * P - 2) + 'px';
    ld.innerHTML = '<span class="v1__name">Leader</span>';
    v1.appendChild(ld);
    R.forEach(function (c, i) {
      var x = c.t0 * P, w = c.dur * P - 2;
      var el = doc.createElement('div');
      el.className = 'v1';
      el.style.left = x + 'px'; el.style.width = w + 'px';
      el.style.backgroundImage = 'url(assets/reel/' + c.stem + '-strip.webp)';
      var nm = doc.createElement('span'); nm.className = 'v1__name'; nm.textContent = c.title;
      el.appendChild(nm);
      c.cuts.forEach(function (ct) {
        var k = doc.createElement('span'); k.className = 'cut'; k.style.left = (ct * P) + 'px';
        el.appendChild(k); cutEls.push({ t: c.t0 + ct, el: k });
      });
      v1.appendChild(el);
      c.v1 = el;
      var lb = doc.createElement('div');
      lb.className = 'v2'; lb.style.left = x + 'px'; lb.style.width = w + 'px'; lb.textContent = c.cat;
      v2.appendChild(lb);
      var au = doc.createElement('div');
      au.className = 'a1'; au.style.left = x + 'px'; au.style.width = w + 'px';
      au.innerHTML = waveSvg(c.wave);
      a1.appendChild(au);
    });
  }
  function waveSvg(w) {
    var n = w.length, top = '', bot = '';
    for (var i = 0; i < n; i++) {
      var a = Math.max(0.04, w[i]) * 46;
      top += (i ? 'L' : 'M') + i + ' ' + (50 - a).toFixed(1);
      bot = 'L' + i + ' ' + (50 + a).toFixed(1) + bot;
    }
    return '<svg viewBox="0 0 ' + (n - 1) + ' 100" preserveAspectRatio="none"><path d="' + top + bot + 'Z"/></svg>';
  }

  // Monitor: one poster + one video per clip, stacked. Hard cuts only.
  R.forEach(function (c) {
    var img = doc.createElement('img');
    img.src = 'assets/reel/' + c.stem + '.webp'; img.alt = ''; img.decoding = 'async';
    var v = doc.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    mon.appendChild(img); mon.appendChild(v);
    c.img = img; c.video = v; c.ready = false; c.painted = false;
  });
  var loading = false;
  function loadClips() {
    if (loading) return; loading = true;
    // Blob-load in timeline order, so the first clip is ready first and seeking
    // never depends on HTTP range support.
    R.reduce(function (chain, c) {
      return chain.then(function () {
        return fetch('assets/reel/' + c.stem + '.mp4').then(function (r) { return r.blob(); }).then(function (b) {
          c.video.src = URL.createObjectURL(b);
          c.video.addEventListener('loadeddata', function () {
            c.ready = true;
            // iOS leaves a seeked-but-never-played muted video blank; play once.
            var pr = c.video.play(); if (pr && pr.then) pr.then(function () { c.video.pause(); }).catch(function () {});
          }, { once: true });
          c.video.addEventListener('seeked', function () { c.painted = true; });
          c.video.addEventListener('playing', function () { c.painted = true; });
          c.video.addEventListener('timeupdate', function () { if (c.video.currentTime > 0) c.painted = true; });
          c.video.load();
        });
      }).catch(function () {});
    }, Promise.resolve());
  }

  var tCur = 0, tPrev = 0, lastNow = performance.now(), vel = 0, active = -2;
  function setActive(i) {
    if (i === active) return;
    var prev = active; active = i;
    leader.classList.toggle('on', i === -1);
    R.forEach(function (c, k) {
      var on = k === i;
      c.video.classList.toggle('on', on && c.ready && c.painted);
      c.img.classList.toggle('on', on && !(c.ready && c.painted));
      c.v1 && c.v1.classList.toggle('on', on);
    });
    if (i < 0) { inspLead.hidden = false; inspClip.hidden = true; return; }
    var c = R[i];
    inspLead.hidden = true; inspClip.hidden = false;
    $('#insp-cat').textContent = c.cat;
    $('#insp-title').textContent = c.title;
    $('#insp-ch').textContent = c.channel;
    $('#insp-full').textContent = mmss(c.full);
    $('#insp-cuts').textContent = String(c.cuts.length);
    if (prev !== -2 && !RM) { insp.classList.remove('swap'); void insp.offsetWidth; insp.classList.add('swap'); }
  }
  $('#insp-watch').addEventListener('click', function () {
    var c = R[active]; if (c) openPlayer(c.id, c.title);
  });


  /* ------------------------------------------------------------- sound -- */
  // Off until the visitor asks: browsers only allow audio after a gesture.
  // When on, the clip's real audio follows the playhead like tape under a
  // scrub: forward only, pitch following scroll speed, silent when still.
  var soundBtn = $('#sound'), soundLabel = $('.sound__label', soundBtn), soundBars = $('.sound__bars', soundBtn);
  var AC = null, master = null, analyser = null, meterBuf = null, bufs = [], soundOn = false, unlockEl = null;
  var voice = null, lastStart = 0;
  function setSoundUI() {
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundLabel.textContent = soundOn ? 'Sound on' : 'Turn on sound';
  }
  function silentWav() {
    // 0.1s of silence. Playing a real <audio> element moves iOS Web Audio onto
    // the media channel, so the ringer switch does not mute the page.
    var n = 4410, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
    function w(o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
  }
  function initAudio() {
    if (AC) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { soundLabel.textContent = 'No audio'; return; }
    AC = new Ctx();
    master = AC.createGain(); master.gain.value = 0.9;
    analyser = AC.createAnalyser(); analyser.fftSize = 512; meterBuf = new Uint8Array(analyser.fftSize);
    master.connect(analyser); analyser.connect(AC.destination);
    soundBtn.setAttribute('aria-busy', 'true');
    Promise.all(R.map(function (c, i) {
      return fetch('assets/reel/' + c.stem + '.m4a').then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
        return new Promise(function (res, rej) { AC.decodeAudioData(ab, res, rej); });
      }).then(function (b) { bufs[i] = b; }).catch(function () {});
    })).then(function () { soundBtn.removeAttribute('aria-busy'); });
  }
  soundBtn.addEventListener('click', function () { soundTouched = true; setSound(!soundOn); });
  var soundTouched = false;
  function setSound(on) {
    soundOn = on; setSoundUI();
    if (soundOn) {
      initAudio();
      if (AC && AC.state === 'suspended') AC.resume();
      try {
        if (!unlockEl) { unlockEl = new Audio(silentWav()); unlockEl.loop = true; unlockEl.setAttribute('playsinline', ''); }
        var pr = unlockEl.play(); if (pr && pr.catch) pr.catch(function () {});
      } catch (e) {}
    } else {
      stopVoice(0.06);
      if (unlockEl) unlockEl.pause();
    }
  }
  function startVoice(i, offset, rate) {
    var b = bufs[i]; if (!b) return;
    var t = AC.currentTime;
    var src = AC.createBufferSource(); src.buffer = b; src.playbackRate.value = rate;
    var g = AC.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01);   // no click, still a hard cut
    src.connect(g); g.connect(master);
    src.start(t, clamp(offset, 0, Math.max(0, b.duration - 0.02)));
    voice = { src: src, g: g, clip: i, pos: offset, rate: rate };
    lastStart = t;
  }
  function stopVoice(fade) {
    if (!voice || !AC) return;
    var v = voice, t = AC.currentTime; voice = null;
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t);
    v.g.gain.linearRampToValueAtTime(0, t + fade);
    try { v.src.stop(t + fade + 0.02); } catch (e) {}
  }
  function beep() {
    // the leader's sync pop, one per count
    if (!AC || !soundOn) return;
    var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.frequency.value = 1000; o.type = 'sine';
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28, t + 0.005);
    g.gain.setValueAtTime(0.28, t + 0.07); g.gain.linearRampToValueAtTime(0, t + 0.08);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.09);
  }
  function meter() {
    if (!analyser || !soundOn) { soundBars.style.cssText = ''; return; }
    analyser.getByteTimeDomainData(meterBuf);
    var sum = 0; for (var i = 0; i < meterBuf.length; i++) { var d = (meterBuf[i] - 128) / 128; sum += d * d; }
    var lv = Math.min(1, Math.sqrt(sum / meterBuf.length) * 4);
    soundBars.style.setProperty('--lv', (lv * 0.7).toFixed(2));
    soundBars.style.setProperty('--lv2', lv.toFixed(2));
    soundBars.style.setProperty('--lv3', (lv * 0.85).toFixed(2));
    soundBars.style.setProperty('--lv4', (lv * 0.55).toFixed(2));
  }
  function soundTick(dt, idx, local, v, visible) {
    if (!AC) return;
    meter();
    if (!soundOn || !visible || idx < 0 || !bufs[idx] || v < 0.3 || (dlg && dlg.open)) { stopVoice(0.08); return; }
    var rate = clamp(v, 0.5, 2);
    var now = AC.currentTime;
    var cut = voice && voice.clip !== idx;
    var drift = voice ? Math.abs(voice.pos - local) : 1;
    if (!voice || cut || (drift > 0.18 && now - lastStart > 0.09)) {
      stopVoice(cut ? 0.006 : 0.025);
      startVoice(idx, local, rate);
    } else {
      voice.src.playbackRate.setTargetAtTime(rate, now, 0.04);
      voice.pos += dt * voice.rate; voice.rate = rate;
    }
  }


  /* -------------------------------------------------------------- play -- */
  // Play runs the reel at 1x on its own. The playhead owns the page while it
  // plays: the scroll position is written to match, so timeline, monitor and
  // page never disagree. Any scroll, swipe or key hands control back.
  var playBtn2 = $('#bay-play'), playLabel = $('.play__label', playBtn2);
  var playing = false, lastSetY = null;
  function playUI() {
    playBtn2.setAttribute('aria-pressed', playing ? 'true' : 'false');
    playLabel.textContent = playing ? 'Pause' : (tCur >= END - 0.1 ? 'Replay' : 'Play');
  }
  function yForT(t) {
    var top = bay.getBoundingClientRect().top + scrollY, travel = bay.offsetHeight - innerHeight;
    return top + (0.015 + clamp(t / (END - 0.04)) * 0.97) * travel;
  }
  function syncScroll() {
    var y = Math.round(yForT(tCur));
    lastSetY = y;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
  }
  function startPlay() {
    if (tCur >= END - 0.1) { tCur = 0; tPrev = 0; }
    playing = true; loadClips();
    if (!soundTouched && !soundOn) setSound(true);   // Play is the gesture that allows sound
    syncScroll(); playUI();
  }
  function stopPlay() {
    if (!playing) return;
    playing = false; lastSetY = null;
    R.forEach(function (c) { if (!c.video.paused) c.video.pause(); });
    playUI();
  }
  playBtn2.addEventListener('click', function () { playing ? stopPlay() : startPlay(); });
  ['wheel', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { stopPlay(); }, { passive: true });
  });
  addEventListener('keydown', function (e) {
    if (e.target === playBtn2 && (e.key === ' ' || e.key === 'Enter')) return;
    if (/^(Arrow|Page|Home|End| )/.test(e.key)) stopPlay();
  });
  function playAdvance(dt) {
    // anything that moved the page under us (scrollbar drag, a menu jump) ends playback
    if (lastSetY !== null && Math.abs(scrollY - lastSetY) > 30) { stopPlay(); return; }
    var i = -1;
    for (var k = 0; k < R.length; k++) if (tCur >= R[k].t0 && tCur < R[k].t0 + R[k].dur) i = k;
    var c = R[i];
    if (c && c.ready) {
      var v = c.video;
      if (v.paused && !v.ended) {
        R.forEach(function (o) { if (o !== c && !o.video.paused) o.video.pause(); });
        var local = tCur - c.t0;
        if (Math.abs(v.currentTime - local) > 0.08) v.currentTime = local;
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      }
      var ct = v.currentTime;
      if (v.ended || ct >= c.dur - 0.06) { v.pause(); tCur = c.t0 + c.dur + 0.001; }
      else if (!v.paused) tCur = Math.max(tCur, c.t0 + ct);
      else tCur += dt;
    } else {
      tCur += dt;   // the leader, or a clip still loading
    }
    if (tCur >= END - 0.04) { tCur = END - 0.04; syncScroll(); stopPlay(); playUI(); return; }
    syncScroll();
  }

  function bayTick(now) {
    var r = bay.getBoundingClientRect();
    if (r.top < innerHeight * 2.5) loadClips();
    if (r.bottom < -40 || r.top > innerHeight + 40) { stopPlay(); soundTick(0, -1, 0, 0, false); return; }
    var dt = Math.min(0.1, Math.max(1, now - lastNow) / 1000); lastNow = now;
    if (playing) playAdvance(dt);
    else {
      var p = prog(bay);
      var target = clamp((p - 0.015) / 0.97) * (END - 0.04);
      tCur += (target - tCur) * (RM ? 1 : 0.2);
      if (Math.abs(target - tCur) < 0.002) tCur = target;
    }
    var inst = (tCur - tPrev) / dt;
    vel += (inst - vel) * 0.15;

    var P = PPS, phx = lanes.clientWidth * PH;
    track.style.transform = 'translate3d(' + (phx - tCur * P).toFixed(1) + 'px,0,0)';

    var idx = -1;
    for (var i = 0; i < R.length; i++) if (tCur >= R[i].t0 && tCur < R[i].t0 + R[i].dur) idx = i;
    if (tCur >= END - 0.05) idx = R.length - 1;
    // Re-evaluate the monitor layer every frame: a clip that finished loading
    // swaps its poster out without waiting for the next cut.
    if (idx !== active) setActive(idx);
    else if (idx >= 0) {
      var c0 = R[idx], live = c0.ready && c0.painted;
      if (c0.video.classList.contains('on') !== live) { c0.video.classList.toggle('on', live); c0.img.classList.toggle('on', !live); }
    }

    if (idx >= 0) {
      var c = R[idx], local = clamp(tCur - c.t0, 0, c.dur - 0.04);
      if (!playing && c.ready && !c.video.seeking && Math.abs(c.video.currentTime - local) > 0.03) c.video.currentTime = local;
    } else {
      var lt = clamp(tCur, 0, LEAD - 0.001);
      leaderN.textContent = String(3 - Math.floor(lt / 0.5));
      leader.style.setProperty('--sweep', ((lt % 0.5) / 0.5).toFixed(3));
    }
    // Every real cut in his edit flashes as the playhead crosses it.
    for (var k = 0; k < cutEls.length; k++) {
      var ce = cutEls[k];
      if ((tPrev < ce.t && tCur >= ce.t) || (tPrev > ce.t && tCur <= ce.t)) {
        ce.el.classList.add('hit');
        (function (el) { setTimeout(function () { el.classList.remove('hit'); }, 60); })(ce.el);
      }
    }
    bayTc.textContent = tc(tCur);
    var a = Math.abs(vel);
    shuttle.textContent = a < 0.06 ? '❚❚ Paused' : (vel > 0 ? '▶ ' : '◀◀ ') + a.toFixed(1) + '×';
    // sound follows the playhead
    [0.02, 0.5, 1.0].forEach(function (m) { if (tPrev < m && tCur >= m) beep(); });
    soundTick(dt, idx, idx >= 0 ? tCur - R[idx].t0 : 0, playing ? 1 : vel, true);
    if (!playing && playLabel.textContent !== (tCur >= END - 0.1 ? 'Replay' : 'Play')) playUI();
    tPrev = tCur;
  }

  /* --------------------------------------------------------------- bin -- */
  var filterBtns = $$('.filters button'), items = $$('#bin-grid .clip');
  function setFilter(cat) {
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === cat ? 'true' : 'false'); });
    items.forEach(function (li) { li.hidden = !(cat === 'all' || li.dataset.cat === cat); });
  }
  filterBtns.forEach(function (b) { b.addEventListener('click', function () { setFilter(b.dataset.filter); }); });
  // Tape counts come from the bin itself, so adding an edit keeps them honest.
  $$('.tape').forEach(function (t) {
    var n = items.filter(function (li) { return li.dataset.cat === t.dataset.filter; }).length;
    $('.tape__n', t).textContent = n + (n === 1 ? ' edit' : ' edits');
  });
  $$('.tape').forEach(function (t) { t.addEventListener('click', function () { setFilter(t.dataset.filter); }); });
  $$('.clip__btn').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); openPlayer(a.dataset.yt, a.dataset.title);
    });
  });

  /* ------------------------------------------------------------ player -- */
  var dlg = $('#player'), frame = $('#player-frame'), lastFocus = null;
  function openPlayer(id, title) {
    lastFocus = doc.activeElement;
    $('#player-title').textContent = title;
    $('#player-yt').href = 'https://youtu.be/' + id;
    frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&modestbranding=1" title="' + title.replace(/"/g, '&quot;') +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    if (dlg.showModal) dlg.showModal(); else window.open('https://youtu.be/' + id, '_blank');
  }
  function closePlayer() { if (dlg.open) dlg.close(); }
  dlg.addEventListener('close', function () { frame.innerHTML = ''; if (lastFocus) lastFocus.focus(); });
  $('#player-x').addEventListener('click', closePlayer);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closePlayer(); });

  /* ------------------------------------------------------------- slate -- */
  var close = $('#hello'), slate = $('#slate'), clap = $('.slate__clap');
  var take = 1, clapped = false, snapping = false;
  try { take = parseInt(sessionStorage.getItem('sk-take'), 10) || 1; } catch (e) {}
  $('#slate-take').textContent = String(take);
  $('#slate-date').textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  function snap() {
    snapping = true; clap.style.transform = '';
    slate.classList.remove('snap'); void slate.offsetWidth; slate.classList.add('snap');
    setTimeout(function () { slate.classList.remove('snap'); snapping = false; }, 480);
  }
  function closeTick() {
    if (!onScreen(close) || snapping || RM) return;
    var p = prog(close);
    var open = 1 - ss(0.3, 0.78, p);
    if (open > 0.02) { clapped = false; clap.style.transform = 'rotate(' + (-24 * open).toFixed(2) + 'deg)'; }
    else if (!clapped) { clapped = true; clap.style.transform = 'rotate(0deg)'; slate.classList.add('snap'); setTimeout(function () { slate.classList.remove('snap'); }, 480); }
  }
  slate.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(slate);
    var project = (f.get('project') || '').trim(), type = f.get('type') || 'Not sure yet';
    var name = (f.get('name') || '').trim(), notes = (f.get('notes') || '').trim();
    var subject = 'Project: ' + (project || 'something new') + ' (' + type + ')';
    var body = 'Hi Sumedh,\n\n' +
      'Project: ' + (project || '(untitled)') + '\n' +
      'Type: ' + type + '\n' +
      (notes ? 'Notes: ' + notes + '\n' : '') +
      '\n' + (name ? name : '');
    snap();
    take += 1;
    try { sessionStorage.setItem('sk-take', String(take)); } catch (err) {}
    setTimeout(function () {
      $('#slate-take').textContent = String(take);
      $('#slate-note').textContent = 'Your email app should open with this filled in. If it doesn’t, write to work.sumedhkant@gmail.com.';
      location.href = 'mailto:work.sumedhkant@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }, RM ? 0 : 420);
  });
  $$('.copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var txt = b.dataset.copy;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { b.textContent = 'Press Ctrl+C'; });
      else b.textContent = 'Select and copy';
    });
  });

  /* -------------------------------------------------------------- loop -- */
  buildTimeline();
  var lastW = innerWidth;
  addEventListener('resize', function () {
    if (innerWidth !== lastW) { lastW = innerWidth; buildTimeline(); }
  }, { passive: true });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(buildTimeline);

  function frameLoop(now) {
    osdTick(); heroTick(); bayTick(now); closeTick();
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  // for the verification harness: has the bay playhead arrived?
  window.__skSound = function () {
    var lv = 0; if (analyser) { analyser.getByteTimeDomainData(meterBuf); var m = 0; for (var i = 0; i < meterBuf.length; i++) m = Math.max(m, Math.abs(meterBuf[i] - 128)); lv = m / 128; }
    return { on: soundOn, state: AC && AC.state, decoded: bufs.filter(Boolean).length, voice: voice && { clip: voice.clip, rate: +voice.rate.toFixed(2) }, peak: +lv.toFixed(3) };
  };
  window.__skBay = function () { return { t: tCur, playing: playing, active: active, ready: R.map(function (c) { return c.ready && c.painted; }) }; };
})();
