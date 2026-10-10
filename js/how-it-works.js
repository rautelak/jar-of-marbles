(() => {
  if (window.self !== window.top) document.documentElement.classList.add('embedded');
  const $ = id => document.getElementById(id);
  const screen = $('screen'), finger = $('finger'), box = $('box');
  const scenes = [$('s1'), $('s2'), $('s3'), $('s4'), $('s4')];
  const caption = $('caption');
  const captions = [
    'Sign in your way',
    'Add people close to you',
    'Leave them a marble',
    'Marbles arrive quietly',
    'Pull one out when you\'re ready',
  ];
  const tabs = { jar: $('t-jar'), add: $('t-add'), circle: $('t-circle') };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let scale = 1, runId = 0, paused = false;

  /* ----- fit the phone to its column ----- */
  function fit() {
    const stage = box.parentElement;
    const avail = stage.clientWidth;
    scale = Math.min(1, avail / 320);
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
    await sleep(650, id);
    finger.classList.add('tap'); el.classList.add('pressed');
    await sleep(170, id);
    finger.classList.remove('tap'); el.classList.remove('pressed');
    if (then) then();
    await sleep(250, id);
  }
  const hideFinger = () => { finger.classList.remove('show'); finger.style.top = '700px'; };

  function setTab(name) { Object.entries(tabs).forEach(([k, el]) => el.classList.toggle('on', k === name)); }
  async function type(el, text, id) {
    el.textContent = '';
    for (const ch of text) { el.textContent += ch; await sleep(38, id); }
  }

  /* ----- jar marbles ----- */
  const spots = [
    { x: 58, y: 232, c: 'coral' }, { x: 100, y: 236, c: 'amber' }, { x: 142, y: 232, c: 'sage' },
    { x: 78, y: 196, c: 'moss' }, { x: 122, y: 198, c: 'amber' }, { x: 100, y: 160, c: 'coral' },
  ];
  const pile = $('pile');
  spots.forEach((s, i) => {
    const m = document.createElement('div');
    m.className = 'marble ' + s.c; m.style.setProperty('--s', '40px');
    m.style.left = s.x - 20 + 'px'; m.style.top = s.y + 20 + 'px';
    m.dataset.i = i; pile.appendChild(m);
  });
  const jarMarbles = [...pile.children];

  /* ----- QR decoration ----- */
  (() => {
    const pattern = '111010111100101001111011101001011100110101101011010011011101001011101110101001110';
    $('qr').innerHTML = [...pattern].map(c => `<span class="${c === '1' ? '' : 'o'}"></span>`).join('');
  })();

  /* ----- scene resets ----- */
  function resetAll() {
    hideFinger();
    $('s1').classList.remove('agreed');
    $('maya-row').classList.remove('in');
    ['dim2', 'sheet2', 'scanner'].forEach(i => $(i).classList.remove('on'));
    $('confirm').classList.remove('on'); $('laser').classList.remove('go');
    $('scan-hint').style.display = '';
    $('finder').style.display = '';
    ['c-dad', 'c-maya', 'p-amber', 'p-sage', 'p-coral', 'p-moss'].forEach(i => $(i).classList.remove('sel'));
    $('typed').textContent = ''; $('ph').style.display = '';
    $('typed').classList.remove('caret');
    $('say-label').textContent = 'What would you like to say to them?';
    $('only').textContent = 'Only they will ever read this.';
    $('done').classList.remove('on');
    $('reader').classList.remove('on');
    $('quote').textContent = '';
    $('b-pull').classList.remove('ready');
    $('quiet').style.opacity = 1;
    $('jar-status').textContent = 'Your jar is empty, for now.';
    jarMarbles.forEach(m => { m.className = m.className.replace(/\b(in|out)\b/g, '').trim(); });
  }

  /* ----- the five scenes ----- */
    const play = [
    async id => { // 1 sign in
      setTab(null);
      await sleep(900, id);
      await tap($('terms-box'), id, () => $('s1').classList.add('agreed'));
      await sleep(600, id);
      await tap($('b-apple'), id);
      await sleep(1500, id);
    },
    async id => { // 2 circle
      setTab('circle');
      await sleep(900, id);
      await tap($('add-card'), id, () => { $('dim2').classList.add('on'); $('sheet2').classList.add('on'); });
      await sleep(800, id);
      await tap($('b-qr'), id, () => { $('sheet2').classList.remove('on'); $('dim2').classList.remove('on'); $('scanner').classList.add('on'); $('laser').classList.add('go'); });
      hideFinger();
      await sleep(2600, id);
      $('laser').classList.remove('go'); $('finder').style.display = 'none'; $('scan-hint').style.display = 'none';
      $('confirm').classList.add('on');
      await sleep(1100, id);
      await tap($('b-add'), id, () => { $('scanner').classList.remove('on'); $('confirm').classList.remove('on'); });
      hideFinger();
      await sleep(500, id);
      $('maya-row').classList.add('in');
      await sleep(2800, id);
    },
    async id => { // 3 add a marble (Maya, then Dad)
      setTab('jar');
      await sleep(500, id);
      await tap($('t-add'), id, () => setTab('add'));
      await sleep(500, id);
      const leave = async (chip, name, text, pick, marbleClass) => {
        await tap($(chip), id, () => {
          $(chip).classList.add('sel');
          $('say-label').textContent = `What would you like to say to ${name}?`;
          $('only').textContent = `Only ${name} will ever read this.`;
        });
        await tap($('ph'), id, () => { $('ph').style.display = 'none'; $('typed').classList.add('caret'); });
        hideFinger();
        await type($('typed'), text, id);
        await sleep(400, id);
        await tap($(pick), id, () => $(pick).classList.add('sel'));
        await sleep(300, id);
        $('done-marble').className = 'marble ' + marbleClass;
        $('done-title').textContent = `It's in ${name}'s jar`;
        $('done-text').textContent = `${name} sees one more marble. Your words wait until they open it.`;
        await tap($('b-drop'), id, () => $('done').classList.add('on'));
        hideFinger();
        await sleep(2600, id);
      };
      await leave('c-maya', 'Maya', 'For showing up exactly when you said you would.', 'p-coral', 'coral');
      // back to a fresh form for the next marble
      $('done').classList.remove('on');
      ['c-dad', 'c-maya', 'p-amber', 'p-sage', 'p-coral', 'p-moss'].forEach(i => $(i).classList.remove('sel'));
      $('typed').textContent = ''; $('typed').classList.remove('caret'); $('ph').style.display = '';
      $('say-label').textContent = 'What would you like to say to them?';
      $('only').textContent = 'Only they will ever read this.';
      await sleep(900, id);
      await leave('c-dad', 'Dad', 'Thank you for teaching me to ride a bike.', 'p-sage', 'sage');
    },
    async id => { // 4 jar fills
      setTab('jar');
      $('b-pull').classList.remove('ready');
      await sleep(900, id);
      for (let i = 0; i < jarMarbles.length; i++) {
        jarMarbles[i].classList.add('in');
        if (i === 0) $('jar-status').textContent = 'Your jar is filling up.';
        await sleep(i < 3 ? 700 : 450, id);
      }
      await sleep(1500, id);
    },
    async id => { // 5 pull one out
      setTab('jar');
      jarMarbles.forEach(m => m.classList.add('in'));
      $('jar-status').textContent = 'Your jar is filling up.';
      $('b-pull').classList.add('ready');
      await sleep(900, id);
      await tap($('b-pull'), id, () => { $('quiet').style.opacity = 0; jarMarbles[5].classList.remove('in'); jarMarbles[5].classList.add('out'); });
      hideFinger();
      await sleep(900, id);
      $('reader').classList.add('on');
      await sleep(900, id);
      await type($('quote'), 'For showing up exactly when you said you would.', id);
      await sleep(2200, id);
    },
  ];

  /* ----- caption + scene visibility ----- */
  function showStep(i) {
    scenes.forEach((s, n) => s.classList.toggle('active', n === i || (i === 4 && n === 3) || (i === 3 && n === 4)));
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
  let started_ = false;
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !started_) { started_ = true; run(0); }
    else if (started_) paused = !en.isIntersecting;
  }, { threshold: 0.25 });
  io.observe(box);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) paused = true;
    else paused = false;
  });
})();
