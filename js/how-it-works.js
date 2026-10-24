(() => {
  if (window.self !== window.top) document.documentElement.classList.add('embedded');
  const $ = id => document.getElementById(id);
  const screen = $('screen'), finger = $('finger'), box = $('box');
  const jar = $('s-jar');
  const scenes = [$('s1'), $('s2'), $('s3'), jar, jar, jar, $('s7'), $('s8')];
  const caption = $('caption');
  const captions = [
    'Sign in your way',
    'Build your circle',
    'Start one jar, together',
    'Add kindness for someone',
    'Pull one out when something hurts',
    'When it fills, pick a time',
    'Open it in person, all of you',
    'Read them, one at a time',
  ];
  const tabs = { jar: $('t-jar'), circle: $('t-circle') };

  let scale = 1, runId = 0, paused = false;

  /* ----- fit the phone to its column ----- */
  function fit() {
    const stage = box.parentElement;
    const avail = stage.clientWidth;
    const wrapStyle = getComputedStyle(document.querySelector('.wrap'));
    const chromeH = parseFloat(wrapStyle.paddingTop) + parseFloat(wrapStyle.paddingBottom)
      + parseFloat(wrapStyle.rowGap || 0) + caption.offsetHeight;
    const byHeight = (innerHeight - chromeH) / 660;
    scale = Math.max(0.45, Math.min(1, avail / 320, byHeight));
    box.style.transform = `scale(${scale})`;
    box.style.width = '320px';
    box.style.height = '660px';
    stage.style.height = 660 * scale + 'px';
    stage.style.width = '';
    box.style.marginRight = (-320 * (1 - scale)) + 'px';
  }
  addEventListener('resize', fit); fit();

  /* ----- pause-aware, cancellable timing ----- */
  class Cancel {}
  const sleep = (ms, id) => new Promise((res, rej) => {
    let left = ms;
    const tick = () => {
      if (id !== runId) return rej(new Cancel());
      if (!paused) left -= 40;
      if (left <= 0) res(); else setTimeout(tick, 40);
    };
    tick();
  });

  /* ----- fake finger ----- */
  function point(el) {
    const s = screen.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: (r.left + r.width / 2 - s.left) / scale, y: (r.top + r.height / 2 - s.top) / scale };
  }
  async function tap(el, id, then) {
    const p = point(el);
    finger.classList.add('show');
    finger.style.left = p.x + 'px'; finger.style.top = p.y + 'px';
    await sleep(600, id);
    finger.classList.add('tap'); el.classList.add('pressed');
    await sleep(160, id);
    finger.classList.remove('tap'); el.classList.remove('pressed');
    if (then) then();
    await sleep(230, id);
  }
  const hideFinger = () => { finger.classList.remove('show'); finger.style.top = '700px'; };

  function setTab(name) { Object.entries(tabs).forEach(([k, el]) => el.classList.toggle('on', k === name)); }
  async function type(el, text, id, speed = 34) {
    el.textContent = '';
    for (const ch of text) { el.textContent += ch; await sleep(speed, id); }
  }
  const on = (...ids) => ids.forEach(i => $(i).classList.add('on'));
  const off = (...ids) => ids.forEach(i => $(i).classList.remove('on'));
  const sel = (...ids) => ids.forEach(i => $(i).classList.add('sel'));

  async function toast(text, id, ms = 2200) {
    $('toast').textContent = text; on('toast');
    await sleep(ms, id);
    off('toast');
  }

  /* ----- the jar: 16 spots (4 people x 4 marbles, a "small" jar) ----- */
  const CAPACITY = 16;
  // Rows from the bottom up, so a full jar is filled to the neck. Coordinates are the jar drawing's.
  const SIZE = 38;
  const rows = [
    { y: 268, xs: [66, 105, 144] }, { y: 232, xs: [72, 111, 150] }, { y: 196, xs: [64, 103, 142] },
    { y: 160, xs: [70, 109, 148] }, { y: 124, xs: [66, 105, 144] }, { y: 88, xs: [105] },
  ];
  const colours = ['coral', 'amber', 'sage', 'moss'];
  const pile = $('pile');
  let n = 0;
  rows.forEach(r => r.xs.forEach(x => {
    const m = document.createElement('div');
    m.className = 'marble ' + colours[n++ % 4];
    m.style.setProperty('--s', SIZE + 'px');
    m.style.left = x - SIZE / 2 + 'px'; m.style.top = r.y - SIZE / 2 + 'px';
    pile.appendChild(m);
  }));
  const jarMarbles = [...pile.children];
  const strip = m => { m.classList.remove('here', 'in', 'out'); };
  function setFill(count) { jarMarbles.forEach((m, i) => { strip(m); if (i < count) m.classList.add('here'); }); }
  const fillText = (count, shelf) =>
    `${count} of ${CAPACITY} marbles${shelf ? ` · ${shelf} on the shelf` : ''} · sealed until you open it together`;

  /* ----- QR decoration ----- */
  (() => {
    const pattern = '111010111100101001111011101001011100110101101011010011011101001011101110101001110';
    $('qr').innerHTML = [...pattern].map(c => `<span class="${c === '1' ? '' : 'o'}"></span>`).join('');
  })();

  /* ----- scene resets ----- */
  function resetAll() {
    hideFinger();
    // 1
    $('s1').classList.remove('agreed'); off('terms-box');
    // 2
    $('maya-row').classList.remove('in');
    off('dim2', 'sheet2', 'scanner', 'confirm'); $('laser').classList.remove('go');
    $('scan-hint').style.display = ''; $('finder').style.display = '';
    // 3
    $('start-empty').style.display = ''; off('members', 'dim3', 'sheet3', 'safe-box');
    $('name-typed').textContent = ''; $('name-typed').classList.remove('caret'); $('name-ph').style.display = '';
    ['c3-dad', 'c3-maya', 'c3-priya', 'sz-small', 'sz-standard', 'k-dad', 'k-maya', 'k-priya',
     'p-amber', 'p-sage', 'p-coral', 'p-moss', 't-fri', 't-sat'].forEach(i => $(i).classList.remove('sel'));
    ['pill-dad', 'pill-maya', 'pill-priya'].forEach(i => { $(i).className = 'pill invited'; $(i).textContent = 'Invited'; });
    $('members-sub').textContent = 'Waiting for everyone to say yes.';
    // 4 to 6
    off('dim-jar', 'kind-sheet', 'hurt-sheet', 'prop-sheet', 'toast', 'push', 'shelf-marble');
    $('jar-actions').classList.remove('off'); $('propose').classList.add('off');
    ['k-typed', 'h-typed'].forEach(i => { $(i).textContent = ''; $(i).classList.remove('caret'); });
    $('k-ph').style.display = ''; $('h-ph').style.display = '';
    $('k-say').textContent = 'What did you notice?';
    setFill(0);
    // 7
    ['w-dad', 'w-maya', 'w-priya'].forEach(i => $(i).classList.remove('ok'));
    $('count').textContent = '1 of 4 have entered the code'; off('unlocked');
    // 8
    off('card-kind', 'card-hurt', 'card-end');
    $('kind-quote').textContent = ''; $('hurt-quote').textContent = '';
    $('hurt-quote').style.display = 'none'; $('hurt-fine').style.display = 'none';
    $('sealed-box').classList.remove('off'); $('mine').classList.remove('off');
    $('hurt-meta').textContent = 'Sealed';
    $('reveal-sub').textContent = 'One at a time, on every phone';
  }

  /* ----- the scenes ----- */
  const play = [
    async id => { // 1 sign in
      setTab(null);
      await sleep(900, id);
      await tap($('terms-box'), id, () => { $('s1').classList.add('agreed'); on('terms-box'); });
      await sleep(500, id);
      await tap($('b-apple'), id);
      await sleep(1300, id);
    },

    async id => { // 2 circle: add Maya by scanning her code
      setTab('circle');
      await sleep(900, id);
      await tap($('add-card'), id, () => on('dim2', 'sheet2'));
      await sleep(700, id);
      await tap($('b-qr'), id, () => { off('sheet2', 'dim2'); on('scanner'); $('laser').classList.add('go'); });
      hideFinger();
      await sleep(2300, id);
      $('laser').classList.remove('go'); $('finder').style.display = 'none'; $('scan-hint').style.display = 'none';
      on('confirm');
      await sleep(1000, id);
      await tap($('b-add'), id, () => off('scanner', 'confirm'));
      hideFinger();
      await sleep(400, id);
      $('maya-row').classList.add('in');
      await sleep(2300, id);
    },

    async id => { // 3 start a jar, everyone says yes
      setTab('jar');
      await sleep(900, id);
      await tap($('start-card'), id, () => on('dim3', 'sheet3'));
      await sleep(500, id);
      await tap($('name-ph'), id, () => { $('name-ph').style.display = 'none'; $('name-typed').classList.add('caret'); });
      hideFinger();
      await type($('name-typed'), 'Sunday Table', id, 55);
      $('name-typed').classList.remove('caret');
      for (const chip of ['c3-dad', 'c3-maya', 'c3-priya']) await tap($(chip), id, () => sel(chip));
      await tap($('sz-small'), id, () => sel('sz-small'));
      await tap($('safe-box'), id, () => on('safe-box'));
      await sleep(300, id);
      await tap($('b-invite'), id, () => { off('sheet3', 'dim3'); $('start-empty').style.display = 'none'; on('members'); });
      hideFinger();
      await sleep(1300, id);
      for (const who of ['dad', 'priya', 'maya']) {
        $(`pill-${who}`).className = 'pill joined'; $(`pill-${who}`).textContent = 'Joined';
        await sleep(850, id);
      }
      $('members-sub').textContent = "Everyone's in. Time to fill it.";
      await sleep(2200, id);
    },

    async id => { // 4 add kindness for Maya
      setTab('jar');
      setFill(6); $('jar-sub').textContent = fillText(6, 0);
      await sleep(1100, id);
      await tap($('b-kind'), id, () => on('dim-jar', 'kind-sheet'));
      await sleep(400, id);
      await tap($('k-maya'), id, () => { sel('k-maya'); $('k-say').textContent = 'What did you notice about Maya?'; });
      await tap($('k-ph'), id, () => { $('k-ph').style.display = 'none'; $('k-typed').classList.add('caret'); });
      hideFinger();
      await type($('k-typed'), 'For staying late to help me set up, without being asked.', id);
      await sleep(300, id);
      await tap($('p-coral'), id, () => sel('p-coral'));
      await tap($('b-seal'), id, () => off('kind-sheet', 'dim-jar'));
      hideFinger();
      await sleep(300, id);
      jarMarbles[6].className = 'marble coral in';
      await sleep(800, id);
      $('jar-sub').textContent = fillText(7, 0);
      await toast('Sealed in. Maya reads it when you open the jar together.', id, 2600);
    },

    async id => { // 5 pull one out for a hurt
      setTab('jar');
      setFill(11); $('jar-sub').textContent = fillText(11, 0);
      await sleep(1100, id);
      await tap($('b-hurt'), id, () => on('dim-jar', 'hurt-sheet'));
      await sleep(400, id);
      await tap($('h-ph'), id, () => { $('h-ph').style.display = 'none'; $('h-typed').classList.add('caret'); });
      hideFinger();
      await type($('h-typed'), 'When plans changed at the last minute, I felt left out, and I need a heads-up next time.', id, 30);
      await sleep(500, id);
      await tap($('b-pullout'), id, () => off('hurt-sheet', 'dim-jar'));
      hideFinger();
      await sleep(300, id);
      jarMarbles[10].classList.remove('here'); jarMarbles[10].classList.add('out');
      await sleep(900, id);
      on('shelf-marble');
      $('jar-sub').textContent = fillText(10, 1);
      await toast("Pulled out. No one in the jar can see who wrote it.", id, 2600);
    },

    async id => { // 6 the jar is full: pick a time
      setTab('jar');
      setFill(CAPACITY); on('shelf-marble');
      $('jar-sub').textContent = `Full: ${CAPACITY} of ${CAPACITY} marbles · 1 on the shelf`;
      $('jar-actions').classList.add('off'); $('propose').classList.remove('off');
      await sleep(900, id);
      on('push');
      await sleep(2400, id);
      off('push');
      await sleep(600, id);
      await tap($('b-propose'), id, () => on('dim-jar', 'prop-sheet'));
      await sleep(500, id);
      await tap($('t-sat'), id, () => sel('t-sat'));
      await sleep(300, id);
      await tap($('b-prop-send'), id, () => off('prop-sheet', 'dim-jar'));
      hideFinger();
      $('propose').classList.add('off');
      $('jar-sub').textContent = 'Opening Saturday, 7 pm, in person. Everyone has been nudged.';
      await sleep(2600, id);
    },

    async id => { // 7 the host shows a code; everyone enters it
      setTab('jar');
      await sleep(1600, id);
      const people = [['w-dad', 2], ['w-maya', 3], ['w-priya', 4]];
      for (const [who, count] of people) {
        $(who).classList.add('ok');
        $('count').textContent = `${count} of 4 have entered the code`;
        await sleep(1000, id);
      }
      on('unlocked');
      await sleep(2600, id);
    },

    async id => { // 8 read them one at a time
      setTab('jar');
      $('reveal-sub').textContent = 'Marble 1 of 17, on every phone';
      on('card-kind');
      await sleep(700, id);
      await type($('kind-quote'), 'Thank you for driving everyone to practice all winter.', id);
      await sleep(1400, id);
      await tap($('b-next1'), id, () => off('card-kind'));
      hideFinger();
      $('reveal-sub').textContent = 'Marble 2 of 17, on every phone';
      await sleep(400, id);
      on('card-hurt');
      await sleep(1600, id);
      await tap($('b-share'), id, () => {
        $('sealed-box').classList.add('off'); $('mine').classList.add('off');
        $('hurt-meta').textContent = 'Shared'; $('hurt-quote').style.display = '';
      });
      hideFinger();
      await type($('hurt-quote'), 'When plans changed at the last minute, I felt left out, and I need a heads-up next time.', id, 28);
      $('hurt-fine').style.display = '';
      await sleep(2200, id);
      off('card-hurt');
      $('reveal-sub').textContent = 'All 17 read';
      await sleep(400, id);
      on('card-end');
      await sleep(3000, id);
    },
  ];

  /* ----- caption + scene visibility ----- */
  function showStep(i) {
    scenes.forEach((s, k) => { if (s !== scenes[i]) s.classList.remove('active'); });
    scenes[i].classList.add('active');
    caption.classList.add('out');
    setTimeout(() => { caption.textContent = captions[i]; caption.classList.remove('out'); }, 300);
  }

  async function run(from) {
    const id = ++runId;
    let i = from;
    try {
      for (;;) {
        resetAll();
        showStep(i);
        await sleep(300, id);
        await play[i](id);
        i = (i + 1) % play.length;
        await sleep(300, id);
      }
    } catch (e) { if (!(e instanceof Cancel)) throw e; }
  }

  // Only animate while on screen, so it doesn't run in a background tab or off-page.
  // how-it-works.html?scene=5 starts at scene 5 (handy when editing one scene).
  const first = Math.min(play.length, Math.max(1, Number(new URLSearchParams(location.search).get('scene')) || 1)) - 1;
  let started_ = false;
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !started_) { started_ = true; run(first); }
    else if (started_) paused = !en.isIntersecting;
  }, { threshold: 0.25 });
  io.observe(box);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) paused = true;
    else paused = false;
  });
})();
