/* Static frontend for TypeRacer.
   Implements the same routes/mechanism as the React app.
*/

const API_BASE = '/api';
const TOKEN_KEY = 'token';

let state = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  route: { path: location.pathname },
};

function setAuthToken(token) {
  state.token = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, { method = 'GET', body = null, token = state.token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let err = { error: `Request failed (${res.status})` };
    try {
      err = await res.json();
    } catch {
      // ignore
    }
    throw new Error(err?.error || err?.message || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function nav() {
  const current = state.route.path;
  const isAuthPage = current === '/auth';

  const navEl = el('nav', { class: 'nav' });
  const inner = el('div', { class: 'nav-inner' });

  const brand = el('a', { href: '/', class: 'brand', onclick: (e) => navigate(e, '/') }, [
    el('span', { class: 'brand-badge' }, ['TR']),
    'TYPERACER'
  ]);

  inner.appendChild(brand);

  const right = el('div', { style: { display: 'flex', gap: '24px', alignItems: 'center' } });

  const leaderboardLink = el('a', {
    href: '/leaderboard',
    class: `link ${current === '/leaderboard' ? 'link-active' : 'link-muted'}`,
    onclick: (e) => navigate(e, '/leaderboard'),
  }, ['Leaderboard']);

  right.appendChild(leaderboardLink);

  if (state.user) {
    const historyLink = el('a', {
      href: '/history',
      class: `link ${current === '/history' ? 'link-active' : 'link-muted'}`,
      onclick: (e) => navigate(e, '/history'),
    }, ['History']);
    right.appendChild(historyLink);

    if (state.user.role === 'admin') {
      const adminLink = el('a', {
        href: '/admin',
        class: `link ${current === '/admin' ? 'link-active' : 'link-muted'}`,
        onclick: (e) => navigate(e, '/admin'),
      }, ['Admin']);
      right.appendChild(adminLink);
    }

    right.appendChild(el('div', { style: { width: '1px', height: '16px', background: 'hsl(var(--border))', margin: '0 8px' } }));

    const userText = el('span', { class: 'text-muted', style: { fontFamily: 'inherit', fontSize: '14px' } }, [state.user.username]);
    right.appendChild(userText);

    const logoutBtn = el('button', {
      class: 'btn btn-outline',
      style: { padding: '8px 12px', textTransform: 'uppercase', fontSize: '12px' },
      onclick: () => {
        setAuthToken(null);
        state.user = null;
        render();
      },
    }, ['LOGOUT']);
    right.appendChild(logoutBtn);
  } else if (!isAuthPage) {
    const loginLink = el('a', { href: '/auth', onclick: (e) => navigate(e, '/auth') }, []);
    loginLink.appendChild(el('button', { class: 'btn btn-primary', style: { padding: '8px 14px' } }, ['LOGIN']));
    right.appendChild(loginLink);
  }

  inner.appendChild(right);
  navEl.appendChild(inner);
  return navEl;
}

function navigate(e, path) {
  if (e) e.preventDefault();
  history.pushState({}, '', path);
  state.route.path = path;
  render();
}

function routeParams() {
  const path = state.route.path;
  const m = path.match(/^\/results\/(\d+)$/);
  if (m) return { id: Number(m[1]) };
  return {};
}

function requireAuth() {
  if (!state.user) {
    navigate(null, '/auth');
    return false;
  }
  return true;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function MEDAL(rank) {
  return { 1: '🥇', 2: '🥈', 3: '🥉' }[rank] ?? String(rank);
}

async function loadMe() {
  const token = state.token;
  if (!token) return;
  try {
    const me = await apiFetch('/auth/me');
    state.user = me;
  } catch {
    setAuthToken(null);
    state.user = null;
  }
}

async function renderHome() {
  const container = el('div', { style: { maxWidth: '1100px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' } });

  const hero = el('div', { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' } }, [
    el('h1', { style: { fontSize: '64px', fontWeight: '900', letterSpacing: '-0.03em' } }, ['TYPERACER']),
    el('p', { class: 'text-muted', style: { fontSize: '18px', maxWidth: '700px', margin: '0 auto' } }, ['The ultimate competitive typing experience. Race against the world.']),
  ]);

  const startBtn = el('a', { href: '/game', onclick: (e) => navigate(e, '/game') }, []);
  startBtn.appendChild(el('button', { class: 'btn btn-primary', style: { fontSize: '14px', padding: '14px 56px' } }, ['START RACE']));

  hero.appendChild(el('div', { style: { paddingTop: '8px' } }, [startBtn]));
  container.appendChild(hero);

  // Top Racers card
  const card = el('div', { class: 'card', style: { width: '100%', overflow: 'hidden' } });
  const header = el('div', { style: { padding: '16px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' } });
  header.appendChild(el('h2', { style: { fontSize: '18px', fontWeight: '900' } }, ['Top Racers']));
  header.appendChild(el('a', { href: '/leaderboard', class: 'link link-active', onclick: (e) => navigate(e, '/leaderboard'), style: { opacity: '0.9' } }, ['View All →']));
  card.appendChild(header);

  const body = el('div', { style: { display: 'flex', flexDirection: 'column' } });

  // If logged in: load stats for personal card
  let stats = null;
  if (state.user) {
    try { stats = await apiFetch('/stats/me'); } catch {}
  }

  if (state.user && stats && Number(stats.totalRaces) > 0) {
    const personal = el('div', { class: 'card', style: { width: '100%', overflow: 'hidden' } });
    const pHeader = el('div', { style: { padding: '16px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' } });
    pHeader.appendChild(el('div', [], [
      el('div', { class: 'text-muted', style: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' } }, ['Pilot']),
      el('h2', { style: { fontSize: '18px', fontWeight: '900' } }, [state.user.username]),
    ]));
    pHeader.appendChild(el('a', { href: '/history', onclick: (e) => navigate(e, '/history'), class: 'link link-active', style: { fontSize: '12px', textTransform: 'none' } }, ['Full History →']));
    personal.appendChild(pHeader);

    const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0', borderTop: '1px solid hsl(var(--border))' } });
    const bestWpm = stats.bestWpm ?? null;
    const avgWpm = stats.avgWpm != null ? Math.round(Number(stats.avgWpm)) : null;
    const avgAcc = stats.avgAccuracy != null ? (Math.round(Number(stats.avgAccuracy) * 10) / 10) : null;

    const mkStat = (label, value, highlight) => {
      return el('div', { style: { padding: '18px 8px', textAlign: 'center' } }, [
        el('div', { class: 'text-muted', style: { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' } }, [label]),
        el('div', { style: { fontSize: '44px', fontWeight: '900', color: highlight ? 'hsl(var(--primary))' : undefined } }, [String(value ?? '—')]),
      ]);
    };

    grid.appendChild(mkStat('TOTAL RACES', String(stats.totalRaces), false));
    grid.appendChild(mkStat('BEST WPM', bestWpm != null ? String(bestWpm) : '—', true));
    grid.appendChild(mkStat('AVG WPM', avgWpm != null ? String(avgWpm) : '—', false));
    grid.appendChild(mkStat('AVG ACCURACY', avgAcc != null ? `${avgAcc}%` : '—', false));
    personal.appendChild(grid);
    container.appendChild(personal);
  }

  if (state.user && stats && Number(stats.totalRaces) === 0) {
    const welcome = el('div', { class: 'card', style: { width: '100%', padding: '32px 24px', textAlign: 'center' } }, [
      el('div', { style: { fontSize: '32px' } }, ['🏁']),
      el('p', { class: 'text-muted', style: { fontSize: '16px' } }, [
        "You haven't raced yet. Hit ",
        el('strong', { style: { color: 'hsl(var(--foreground))' } }, ['Start Race']),
        ' to set your first record.',
      ])
    ]);
    container.appendChild(welcome);
  }

  // Leaderboard fetch
  let entries = [];
  try {
    entries = await apiFetch('/leaderboard?difficulty=all&limit=5');
  } catch {
    entries = [];
  }

  if (!entries.length) {
    body.appendChild(el('div', { class: 'text-muted', style: { textAlign: 'center', padding: '40px 0' } }, ['No races yet — be the first!']));
  } else {
    entries.forEach((entry) => {
      const row = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid hsl(var(--border))' } });

      const left = el('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } });
      left.appendChild(el('span', { style: { width: '32px', textAlign: 'center', fontSize: '24px' } }, [MEDAL(entry.rank)]));

      const nameWrap = el('div', { style: { display: 'flex', flexDirection: 'column' } });
      const name = el('div', { style: { fontWeight: '900' } }, [entry.username]);
      nameWrap.appendChild(name);
      if (state.user?.username === entry.username) {
        nameWrap.appendChild(el('span', { class: 'text-primary', style: { fontSize: '12px', opacity: '0.6' } }, ['you']));
      }

      left.appendChild(nameWrap);

      const right = el('div', { style: { display: 'flex', alignItems: 'center', gap: '32px' } });
      right.appendChild(el('div', { style: { textAlign: 'right' } }, [
        el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.06em' } }, ['WPM']),
        el('div', { style: { fontFamily: 'inherit', fontWeight: '900', color: 'hsl(var(--primary))', fontSize: '24px' } }, [String(entry.wpm)]),
      ]));

      right.appendChild(el('div', { style: { textAlign: 'right', width: '56px' } }, [
        el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.06em' } }, ['ACC']),
        el('div', { style: { fontFamily: 'inherit', fontWeight: '900' } }, [`${entry.accuracy}%`]),
      ]));

      right.appendChild(el('div', { style: { display: 'none' } }));

      row.appendChild(left);
      row.appendChild(right);
      body.appendChild(row);
    });
  }

  card.appendChild(body);
  container.appendChild(card);
  return container;
}

async function renderAuth() {
  const container = el('div', { style: { minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' } });
  const card = el('div', { class: 'card', style: { width: '100%', maxWidth: '420px', padding: '0', background: 'rgba(255,255,255,0.03)' } });

  const stateUI = { mode: 'login' };

  const title = el('div', { class: 'text-primary', style: { padding: '24px 24px 0', textAlign: 'center' } }, [
    el('h1', { style: { fontSize: '28px', fontWeight: '900' } }, ['ACCESS TERMINAL']),
    el('div', { class: 'text-muted', style: { marginTop: '8px' } }, ['Enter your credentials to continue']),
  ]);

  const content = el('div', { style: { padding: '24px' } });

  const swap = () => {
    stateUI.mode = stateUI.mode === 'login' ? 'register' : 'login';
    title.innerHTML = '';

    if (stateUI.mode === 'login') {
      title.appendChild(el('h1', { style: { fontSize: '28px', fontWeight: '900', color: 'hsl(var(--primary))' } }, ['ACCESS TERMINAL']));
      title.appendChild(el('div', { class: 'text-muted', style: { marginTop: '8px' } }, ['Enter your credentials to continue']));
    } else {
      title.appendChild(el('h1', { style: { fontSize: '28px', fontWeight: '900', color: 'hsl(var(--primary))' } }, ['REGISTER PILOT']));
      title.appendChild(el('div', { class: 'text-muted', style: { marginTop: '8px' } }, ['Create a new account']));
    }

    renderForm();
  };

  function renderForm() {
    content.innerHTML = '';

    const form = el('form', { onsubmit: async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = stateUI.mode === 'login' ? 'AUTHENTICATING...' : 'REGISTERING...';

      try {
        if (stateUI.mode === 'login') {
          const email = emailInput.value.trim();
          const password = passwordInput.value;
          const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
          setAuthToken(res.token);
          state.user = res.user;
          navigate(null, '/game');
        } else {
          const username = usernameInput.value.trim();
          const email = emailInput.value.trim();
          const password = passwordInput.value;
          const res = await apiFetch('/auth/register', { method: 'POST', body: { username, email, password } });
          setAuthToken(res.token);
          state.user = res.user;
          navigate(null, '/game');
        }
      } catch (err) {
        alert(err?.message || String(err));
      } finally {
        btn.disabled = false;
        btn.textContent = stateUI.mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT';
      }
    }});

    let usernameInput = null;
    let emailInput = null;
    let passwordInput = null;

    if (stateUI.mode === 'register') {
      form.appendChild(el('div', { style: { marginBottom: '12px' } }, [
        el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginBottom: '6px' } }, ['Username']),
        (usernameInput = el('input', { class: 'input', placeholder: 'SpeedRacer99' }))
      ]));
    }

    form.appendChild(el('div', { style: { marginBottom: '12px' } }, [
      el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginBottom: '6px' } }, ['Email']),
      (emailInput = el('input', { class: 'input', placeholder: 'pilot@typeracer.com' }))
    ]));

    form.appendChild(el('div', { style: { marginBottom: '12px' } }, [
      el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginBottom: '6px' } }, ['Password']),
      (passwordInput = el('input', { class: 'input', type: 'password', placeholder: '••••••••' }))
    ]));

    const btn = el('button', { class: 'btn btn-primary', style: { width: '100%', fontSize: '12px', padding: '12px 16px' } }, [
      stateUI.mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'
    ]);

    form.appendChild(btn);
    form.appendChild(el('div', { style: { marginTop: '18px', textAlign: 'center' } }, [
      el('button', {
        type: 'button',
        class: 'btn btn-ghost',
        style: { fontSize: '12px', padding: '0', textTransform: 'none', color: 'hsl(var(--muted-foreground))' },
        onclick: swap
      }, [stateUI.mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'])
    ]));

    content.appendChild(form);

    // keep references
    return { btn, emailInput, passwordInput, usernameInput };
  }

  // initial render
  card.appendChild(title);
  card.appendChild(content);
  container.appendChild(card);

  // render the form and (important) ensure we always re-render on swap
  renderForm();

  return container;
}

async function renderLeaderboard() {
  const container = el('div', { style: { maxWidth: '900px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', gap: '32px' } });
  container.appendChild(el('div', [], [
    el('h1', { style: { fontSize: '34px', fontWeight: '900', marginBottom: '6px' } }, ['GLOBAL LEADERBOARD']),
    el('p', { class: 'text-muted', style: { margin: 0 } }, ['All-time race history, ranked by speed.']),
  ]));

  const tabs = ['all', 'easy', 'medium', 'hard'];
  let difficulty = 'all';

  const tabsRow = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '1px solid hsl(var(--border))', borderRadius: '8px', overflow: 'hidden' } });

  const mkTab = (v) => {
    const b = el('button', {
      type: 'button',
      style: {
        background: difficulty === v ? 'rgba(142,255,142,0.15)' : 'rgba(255,255,255,0.03)',
        border: 'none',
        padding: '12px 0',
        cursor: 'pointer',
        fontWeight: '900',
        textTransform: 'uppercase',
        color: difficulty === v ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
      },
      onclick: () => {
        difficulty = v;
        render();
      },
    }, [String(v).toUpperCase()]);
    return b;
  };

  tabs.forEach((t) => tabsRow.appendChild(mkTab(t)));
  container.appendChild(tabsRow);

  const card = el('div', { class: 'card', style: { overflow: 'hidden' } });

  const table = el('table', { class: 'table' });
  const thead = el('thead', [], [
    el('tr', [], [
      el('th', { style: { width: '48px' } }, ['#']),
      el('th', [], ['PILOT']),
      el('th', { style: { textAlign: 'right' } }, ['WPM']),
      el('th', { style: { textAlign: 'right' } }, ['ACC']),
      el('th', { style: { textAlign: 'right' } }, ['MODE']),
      el('th', { style: { textAlign: 'right' } }, ['DATE']),
    ])
  ]);
  table.appendChild(thead);
  const tbody = el('tbody');
  table.appendChild(tbody);
  card.appendChild(table);
  container.appendChild(card);

  const rows = await apiFetch(`/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=100`).catch(() => []);
  tbody.innerHTML = '';

  if (!rows.length) {
    tbody.appendChild(el('tr', [], [
      el('td', { colspan: '6', style: { textAlign: 'center', padding: '40px 0' } }, [
        el('div', { style: { fontSize: '28px' } }, ['🏁']),
        el('div', { class: 'text-muted', style: { marginTop: '6px' } }, ['No races yet. Be the first!']),
      ])
    ]));
  } else {
    rows.forEach((entry) => {
      const tr = el('tr', {
        style: {
          background: state.user?.username === entry.username ? 'rgba(142,255,142,0.1)' : 'transparent',
          borderLeft: state.user?.username === entry.username ? '2px solid hsl(var(--primary))' : 'none',
        },
      });

      tr.appendChild(el('td', { style: { textAlign: 'center', fontWeight: '900' } }, [MEDAL(entry.rank)]));
      tr.appendChild(el('td', { style: { fontWeight: '900' } }, [
        entry.username,
        state.user?.username === entry.username ? el('span', { style: { marginLeft: '8px', fontSize: '12px', fontWeight: '400', color: 'hsla(142,70%,50%,0.6)' } }, ['you']) : null,
      ].filter(Boolean)));
      tr.appendChild(el('td', { style: { textAlign: 'right', fontWeight: '900', color: 'hsl(var(--primary))', fontSize: '18px' } }, [String(entry.wpm)]));
      const accColor = entry.accuracy >= 98 ? ' #2ecc71' : entry.accuracy >= 90 ? '#f1c40f' : '#ff4d4d';
      tr.appendChild(el('td', { style: { textAlign: 'right' } }, [
        el('span', { style: { color: accColor } }, [`${entry.accuracy}%`]),
      ]));

      const diff = entry.difficulty;
      const diffBg = diff === 'easy' ? 'rgba(46,204,113,0.2)' : diff === 'medium' ? 'rgba(241,196,15,0.2)' : 'rgba(255,77,77,0.2)';
      const diffFg = diff === 'easy' ? 'rgb(46,204,113)' : diff === 'medium' ? 'rgb(241,196,15)' : 'rgb(255,77,77)';
      tr.appendChild(el('td', { style: { textAlign: 'right' } }, [
        el('span', { style: { background: diffBg, color: diffFg, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' } }, [diff]),
      ]));

      tr.appendChild(el('td', { style: { textAlign: 'right', fontSize: '12px', color: 'hsl(var(--muted-foreground))' } }, [formatDate(entry.racedAt)]));
      tbody.appendChild(tr);
    });
  }

  if (rows.length > 0) {
    container.appendChild(el('p', { class: 'text-muted', style: { textAlign: 'center', fontSize: '12px', margin: '-8px 0 0' } }, [`Showing ${rows.length} race${rows.length !== 1 ? 's' : ''}`]));
  }

  return container;
}

async function renderHistory() {
  if (!requireAuth()) return el('div');

  const container = el('div', { style: { maxWidth: '900px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', gap: '32px' } });
  container.appendChild(el('div', [], [
    el('h1', { style: { fontSize: '34px', fontWeight: '900', marginBottom: '6px' } }, ['CAREER HISTORY']),
    el('p', { class: 'text-muted', style: { margin: 0 } }, ['Your past races and performance.']),
  ]));

  const card = el('div', { class: 'card', style: { overflow: 'hidden' } });
  const table = el('table', { class: 'table' });

  table.appendChild(el('thead', [], [
    el('tr', [], [
      el('th', { style: { width: '96px', textAlign: 'left' } }, ['DATE']),
      el('th', { style: { textAlign: 'right' } }, ['WPM']),
      el('th', { style: { textAlign: 'right' } }, ['ACCURACY']),
      el('th', { style: { textAlign: 'right' } }, ['MODE']),
      el('th', { style: { width: '96px' } }, [''])
    ])
  ]));

  const tbody = el('tbody');
  table.appendChild(tbody);
  card.appendChild(table);
  container.appendChild(card);

  const historyRes = await apiFetch('/results/history?limit=50').catch(() => ({ data: [] }));
  const history = historyRes.data ?? [];

  if (!history.length) {
    tbody.appendChild(el('tr', [], [
      el('td', { colspan: '5', style: { textAlign: 'center', padding: '40px 0' } }, [
        el('div', { class: 'text-muted' }, ['NO RACES COMPLETED YET'])
      ])
    ]));
  } else {
    history.forEach((r) => {
      const tr = el('tr');
      tr.appendChild(el('td', { class: 'text-muted' }, [new Date(r.createdAt).toLocaleDateString()]));
      tr.appendChild(el('td', { style: { textAlign: 'right', fontWeight: '900', color: 'hsl(var(--primary))', fontSize: '18px' } }, [String(r.wpm)]));
      tr.appendChild(el('td', { style: { textAlign: 'right' } }, [`${r.accuracy}%`]));
      tr.appendChild(el('td', { style: { textAlign: 'right', textTransform: 'uppercase', fontSize: '12px', color: 'hsl(var(--muted-foreground))' } }, [r.difficulty]));
      const td = el('td', { style: { textAlign: 'right' } });
      const btn = el('button', { class: 'btn btn-ghost', style: { fontSize: '12px', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px' }, onclick: () => navigate(null, `/results/${r.id}`) }, ['DETAILS']);
      td.appendChild(btn);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  return container;
}

async function renderResults() {
  if (!requireAuth()) return el('div');

  const { id } = routeParams();
  const container = el('div', { style: { maxWidth: '800px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', gap: '24px' } });
  const loading = el('div', { class: 'text-primary', style: { textAlign: 'center', padding: '40px 0' } }, ['ANALYZING RACE DATA...']);
  container.appendChild(loading);

  const result = await apiFetch(`/results/${id}`).catch(() => null);
  container.innerHTML = '';

  if (!result) {
    container.appendChild(el('div', { style: { textAlign: 'center', padding: '40px 0', color: 'hsl(var(--destructive))', fontWeight: '900' } }, ['RECORD NOT FOUND']));
    return container;
  }

  const isNewPb = result.personalBestWpm ? result.wpm > result.personalBestWpm : true;

  container.appendChild(el('div', { style: { textAlign: 'center' } }, [
    el('h1', { style: { fontSize: '36px', fontWeight: '900' } }, ['RACE COMPLETED']),
    el('p', { class: 'text-muted', style: { marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '12px' } }, [`Target: ${result.difficulty} mode`])
  ]));

  const grid = el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } });
  grid.appendChild(el('div', { class: 'card', style: { padding: '24px 18px', textAlign: 'center', border: '1px solid hsla(142,70%,50%,0.3)' } }, [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.08em' } }, ['SPEED']),
    el('div', { style: { fontSize: '56px', fontWeight: '900', color: 'hsl(var(--primary))' } }, [String(result.wpm)]),
    el('div', { class: 'text-muted', style: { marginTop: '4px' } }, ['WPM']),
    isNewPb ? el('div', { style: { marginTop: '14px', fontSize: '12px', background: 'rgba(142,70%,50%,0.15)', color: 'hsl(var(--primary))', padding: '6px 10px', borderRadius: '6px', display: 'inline-block', fontWeight: '900' } }, ['NEW PERSONAL BEST!']) : null,
  ]));

  grid.appendChild(el('div', { class: 'card', style: { padding: '24px 18px', textAlign: 'center' } }, [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.08em' } }, ['ACCURACY']),
    el('div', { style: { fontSize: '44px', fontWeight: '900', color: result.accuracy >= 98 ? 'hsl(var(--primary))' : result.accuracy >= 90 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' } }, [`${result.accuracy}%`]),
  ]));

  grid.appendChild(el('div', { class: 'card', style: { padding: '24px 18px', textAlign: 'center' } }, [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.08em' } }, ['TIME TAKEN']),
    el('div', { style: { fontSize: '40px', fontWeight: '900' } }, [(result.timeTakenMs / 1000).toFixed(1) + 's']),
  ]));

  container.appendChild(grid);

  const transcript = el('div', { class: 'card', style: { padding: '18px' } });
  transcript.appendChild(el('h3', { style: { fontWeight: '900', margin: '0 0 12px', fontSize: '18px' } }, ['Race Transcript']));
  transcript.appendChild(el('div', { style: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'hsl(var(--muted-foreground))', lineHeight: '1.6', padding: '14px', borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'rgba(255,255,255,0.03)' } }, [result.paragraph]));

  container.appendChild(transcript);

  const actions = el('div', { style: { display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '12px' } });
  const again = el('a', { href: '/game', onclick: (e) => navigate(e, '/game') }, []);
  again.appendChild(el('button', { class: 'btn btn-primary', style: { padding: '14px 28px', fontSize: '12px' } }, ['RACE AGAIN']));
  const lb = el('a', { href: '/leaderboard', onclick: (e) => navigate(e, '/leaderboard') }, []);
  lb.appendChild(el('button', { class: 'btn btn-outline', style: { padding: '14px 28px', fontSize: '12px' } }, ['VIEW LEADERBOARD']));
  actions.appendChild(again);
  actions.appendChild(lb);
  container.appendChild(actions);

  return container;
}

async function renderGame() {
  if (!requireAuth()) return el('div');

  const wrap = el('div', { style: { maxWidth: '900px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', gap: '48px' } });
  wrap.appendChild(el('div', { class: 'text-primary', style: { textAlign: 'center', padding: '40px 0', fontWeight: '900' } }, ['CONNECTING...']));

  let game = null;
  try {
    game = await apiFetch('/games/random');
  } catch (e) {
    wrap.innerHTML = '';
    wrap.appendChild(el('div', { class: 'text-muted', style: { textAlign: 'center', padding: '40px 0' } }, ['No game available. Add tracks in Admin.']));
    return wrap;
  }

  wrap.innerHTML = '';

  // HUD
  const hud = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '12px' } });
  const speedBlock = el('div', { style: { display: 'flex', gap: '48px' } });
  const speed = el('div', [], [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.16em' } }, ['SPEED']),
    el('div', { style: { fontSize: '56px', fontWeight: '900', fontFamily: 'inherit', color: 'hsl(var(--primary))' } }, [el('span', { id: 'wpmValue' }, ['0']), el('span', { style: { fontSize: '24px', marginLeft: '6px', color: 'hsl(var(--muted-foreground))' } }, ['WPM'])]),
  ]);
  const accuracyBlock = el('div', [], [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.16em' } }, ['ACCURACY']),
    el('div', { style: { fontSize: '56px', fontWeight: '900', fontFamily: 'inherit' } }, [el('span', { id: 'accValue' }, ['100']), el('span', { style: { fontSize: '24px', marginLeft: '6px', color: 'hsl(var(--muted-foreground))' } }, ['%'])]),
  ]);
  speedBlock.appendChild(speed);
  speedBlock.appendChild(accuracyBlock);

  const timeBlock = el('div', { style: { textAlign: 'right' } }, [
    el('div', { class: 'text-muted', style: { textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.16em' } }, ['TIME']),
    el('div', { id: 'timeValue', style: { fontSize: '36px', fontWeight: '900' } }, ['0.0s'])
  ]);

  hud.appendChild(speedBlock);
  hud.appendChild(timeBlock);
  wrap.appendChild(hud);

  // Typing area
  const typing = el('div', { class: 'typing-area', onclick: () => input.focus() });
  typing.appendChild(el('input', { id: 'hiddenInput', style: { position: 'absolute', opacity: '0', pointerEvents: 'none', width: '0', height: '0' } }));

  const cursorWrap = el('div', { style: { position: 'relative' } });
  const overlay = el('div', { id: 'charsOverlay', style: { position: 'relative' } });
  cursorWrap.appendChild(overlay);
  typing.appendChild(cursorWrap);
  wrap.appendChild(typing);

  const restartRow = el('div', { style: { display: 'flex', justifyContent: 'center', paddingTop: '8px' } });
  const restartBtn = el('button', { class: 'btn btn-outline', style: { padding: '14px 24px', fontSize: '12px', borderRadius: '8px' } }, ['RESTART (ESC)']);
  restartRow.appendChild(restartBtn);
  wrap.appendChild(restartRow);

  let typed = '';
  let errors = new Set();
  let running = false;
  let elapsedMs = 0;
  let startTime = null;
  let interval = null;

  // websocket
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}/ws`;
  const ws = new WebSocket(wsUrl);

  function startTimer() {
    if (running) return;
    running = true;
    startTime = Date.now() - elapsedMs;
    interval = setInterval(() => {
      if (!startTime) return;
      elapsedMs = Date.now() - startTime;
      timeValue.textContent = (elapsedMs / 1000).toFixed(1) + 's';

      if (typed.length > 0) {
        const minutes = elapsedMs / 60000;
        const words = typed.length / 5;
        const currentWpm = Math.max(0, Math.round(words / (minutes || 1)));
        const correctChars = typed.length - errors.size;
        const currentAccuracy = Math.max(0, Math.round((correctChars / typed.length) * 100));
        wpmValue.textContent = String(currentWpm);
        accValue.textContent = String(currentAccuracy);

        if (running) {
          ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'WPM_UPDATE', wpm: currentWpm, accuracy: currentAccuracy }));
        }
      }
    }, 100);
  }

  function pauseTimer() {
    running = false;
    if (interval) clearInterval(interval);
    interval = null;
  }

  function resetAll() {
    typed = '';
    errors = new Set();
    elapsedMs = 0;
    running = false;
    startTime = null;
    if (interval) clearInterval(interval);
    interval = null;

    wpmValue.textContent = '0';
    accValue.textContent = '100';
    timeValue.textContent = '0.0s';
    renderChars();
    input.focus();
  }

  const input = typing.querySelector('#hiddenInput');
  const overlayEl = typing.querySelector('#charsOverlay');
  const wpmValue = wrap.querySelector('#wpmValue');
  const accValue = wrap.querySelector('#accValue');
  const timeValue = wrap.querySelector('#timeValue');


  function renderChars() {
    overlayEl.innerHTML = '';
    const paragraph = game.paragraph;

    const cursorIndex = typed.length;
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i];
      let cls = 'char';
      if (i < typed.length) {
        if (errors.has(i)) cls = 'char-error';
        else cls = 'char-correct';
      }
      const span = el('span', { class: cls, style: { position: 'relative' } }, [char]);

      const isCursor = i === cursorIndex && !isComplete();
      if (isCursor) {
        span.appendChild(el('span', { class: 'cursor' }, []));
      }
      overlayEl.appendChild(span);
    }
  }

  function isComplete() {
    return typed.length === game.paragraph.length && !errors.has(game.paragraph.length - 1);
  }

  function handleInput(val) {
    if (isComplete()) return;

    // allow only forward/backspace-ish; same logic as hook
    if (Math.abs(val.length - typed.length) > 1 && typed.length > 0) return;

    const newTyped = val.substring(0, game.paragraph.length);
    const newErrors = new Set(errors);

    const currentIndex = newTyped.length - 1;
    if (currentIndex >= 0) {
      if (newTyped[currentIndex] !== game.paragraph[currentIndex]) newErrors.add(currentIndex);
      else newErrors.delete(currentIndex);
    }

    for (let i = newTyped.length; i < game.paragraph.length; i++) newErrors.delete(i);

    typed = newTyped;
    errors = newErrors;

    if (typed.length > 0 && typed.length === 1 && !running) {
      startTimer();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'START', gameId: game.id, userId: state.user.id }));
      }
    }

    // compute current wpm/accuracy immediately
    if (typed.length > 0 && elapsedMs > 0) {
      const minutes = elapsedMs / 60000;
      const words = typed.length / 5;
      const currentWpm = Math.max(0, Math.round(words / (minutes || 1)));
      const correctChars = typed.length - errors.size;
      const currentAccuracy = Math.max(0, Math.round((correctChars / typed.length) * 100));
      wpmValue.textContent = String(currentWpm);
      accValue.textContent = String(currentAccuracy);

      if (running) {
        ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'WPM_UPDATE', wpm: currentWpm, accuracy: currentAccuracy }));
      }
    }

    renderChars();

    if (isComplete() && running) {
      pauseTimer();
      restartBtn.disabled = true;
      restartBtn.textContent = 'SAVING...';

      apiFetch('/results', {
        method: 'POST',
        body: {
          gameId: game.id,
          wpm: Number(wpmValue.textContent),
          accuracy: Number(accValue.textContent),
          timeTakenMs: elapsedMs,
        }
      })
        .then((res) => {
          navigate(null, `/results/${res.id}`);
        })
        .catch((err) => {
          alert(err?.message || String(err));
          restartBtn.disabled = false;
          restartBtn.textContent = 'RESTART (ESC)';
        });
    }
  }

  // key input: capture typing via keydown and maintain hidden input value
  input.value = '';
  renderChars();

  // allow click/tap to keep focus on the typing input
  setTimeout(() => {
    input?.focus();
  }, 100);

  document.addEventListener('click', () => {
    input?.focus();
  });


  input.addEventListener('keydown', (e) => {
    e.preventDefault();

    if (e.key === 'Escape') {
      resetAll();
      return;
    }

    if (e.key === 'Backspace') {
      handleInput(typed.slice(0, -1));
      return;
    }

    if (e.key.length === 1) {
      handleInput(typed + e.key);
      return;
    }
  });

  // ESC listener for restart
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // avoid interfering with auth typing etc.
      resetAll();
    }
  });

  restartBtn.onclick = () => resetAll();

  ws.onopen = () => {
    // no-op; START comes on first keystroke
  };

  return wrap;
}

async function renderAdmin() {
  if (!requireAuth()) return el('div');
  if (state.user.role !== 'admin') {
    alert('Admin clearance required');
    navigate(null, '/');
    return el('div');
  }

  const container = el('div', { style: { maxWidth: '1200px', margin: '0 auto', padding: '80px 16px', display: 'flex', flexDirection: 'column', gap: '32px' } });

  container.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
    el('div', [], [
      el('h1', { style: { fontSize: '34px', fontWeight: '900', marginBottom: '6px' } }, ['SYSTEM ADMINISTRATION']),
      el('p', { class: 'text-muted', style: { margin: 0 } }, ['Manage racing tracks and system parameters.']),
    ]),
  ]));

  const addBtn = el('button', { class: 'btn btn-primary', style: { fontSize: '12px' }, onclick: () => openAddModal() }, ['ADD TRACK']);
  container.firstChild.appendChild(addBtn);

  const card = el('div', { class: 'card', style: { overflow: 'hidden' } });

  const table = el('table', { class: 'table' });
  const thead = el('thead');
  thead.appendChild(el('tr', [], [
    el('th', { style: { width: '60px' } }, ['ID']),
    el('th', { style: { width: '90px' } }, ['MODE']),
      el('th', [], ['CONTENT']),
    el('th', { style: { width: '240px', textAlign: 'right' } }, ['ACTIONS'])
  ]));
  table.appendChild(thead);
  const tbody = el('tbody');
  table.appendChild(tbody);
  card.appendChild(table);
  container.appendChild(card);

  const PAGE_LIMIT = 100;
  async function refreshGames() {
    tbody.innerHTML = '';
    let gamesData = { data: [] };
    try {
      gamesData = await apiFetch(`/games?limit=${PAGE_LIMIT}`);
    } catch {
      gamesData = { data: [] };
    }
    const games = gamesData.data ?? gamesData;

    if (!games.length) {
      tbody.appendChild(el('tr', [], [el('td', { colspan: '4', style: { textAlign: 'center', padding: '40px 0' } }, ['LOADING...'])]));
      return;
    }

    games.forEach((g) => {
      const tr = el('tr');
      tr.appendChild(el('td', { class: 'text-muted' }, [String(g.id)]));
      tr.appendChild(el('td', { style: { textTransform: 'uppercase', fontSize: '12px' } }, [g.difficulty]));

      const contentTd = el('td');
      contentTd.appendChild(el('div', { style: { fontFamily: 'inherit', fontSize: '14px', color: 'hsl(var(--muted-foreground))', maxWidth: '520px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, [g.paragraph]));
      tr.appendChild(contentTd);

      const actions = el('td', { style: { textAlign: 'right' } });
      const editBtn = el('button', { class: 'btn btn-ghost', style: { border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px 12px', marginRight: '10px' } , onclick: () => openEditModal(g) }, ['EDIT']);
      const delBtn = el('button', { class: 'btn btn-ghost', style: { border: '1px solid hsl(var(--destructive-border))', color: 'hsl(var(--destructive))', borderRadius: '8px', padding: '8px 12px' }, onclick: () => deleteGame(g.id) }, ['DEL']);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
  }

  async function deleteGame(id) {
    if (!confirm('Delete this track?')) return;
    try {
      await apiFetch(`/games/${id}`, { method: 'DELETE' });
      refreshGames();
      alert('Track deleted.');
    } catch (e) {
      alert(e?.message || String(e));
    }
  }

  let modalRoot = null;
  function closeModal() {
    if (modalRoot) modalRoot.remove();
    modalRoot = null;
  }

  function openAddModal() {
    const modal = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === modal) closeModal(); } });
    const m = el('div', { class: 'modal' });

    const title = el('h2', { style: { margin: 0, fontSize: '18px', fontWeight: '900', color: 'hsl(var(--primary))' } }, ['NEW RACE TRACK']);
    m.appendChild(title);

    const difficultySel = el('select', { class: 'input', style: { marginTop: '12px' } });
    ['easy', 'medium', 'hard'].forEach((d) => difficultySel.appendChild(el('option', { value: d }, [d])));
    difficultySel.value = 'medium';

    const label = el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginTop: '12px' } }, ['Difficulty']);

    const paragraphArea = el('textarea', { placeholder: 'Enter track text here...', style: { minHeight: '150px', marginTop: '8px' } });

    const lenInfo = el('div', { class: 'text-muted', style: { fontSize: '12px', textAlign: 'right', marginTop: '6px' } }, ['0 / 500']);
    paragraphArea.addEventListener('input', () => {
      const len = paragraphArea.value.length;
      lenInfo.textContent = `${len} / 500`;
    });

    const save = el('button', { class: 'btn btn-primary', style: { width: '100%', marginTop: '16px' }, onclick: async () => {
      save.disabled = true;
      try {
        await apiFetch('/games', { method: 'POST', body: { paragraph: paragraphArea.value, difficulty: difficultySel.value } });
        closeModal();
        refreshGames();
        alert('Success');
      } catch (e) {
        alert(e?.message || String(e));
      } finally {
        save.disabled = false;
      }
    } }, ['SAVE TRACK']);

    m.appendChild(label);
    m.appendChild(difficultySel);
    m.appendChild(el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginTop: '12px' } }, ['Content']));
    m.appendChild(paragraphArea);
    m.appendChild(lenInfo);
    m.appendChild(save);

    modal.appendChild(m);
    document.body.appendChild(modal);
    modalRoot = modal;
  }

  function openEditModal(game) {
    const modal = el('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === modal) closeModal(); } });
    const m = el('div', { class: 'modal' });

    const title = el('h2', { style: { margin: 0, fontSize: '18px', fontWeight: '900', color: 'hsl(var(--primary))' } }, [`EDIT TRACK #${game.id}`]);
    m.appendChild(title);

    const difficultySel = el('select', { class: 'input', style: { marginTop: '12px' } });
    ['easy', 'medium', 'hard'].forEach((d) => difficultySel.appendChild(el('option', { value: d }, [d])));
    difficultySel.value = game.difficulty;

    const paragraphArea = el('textarea', { style: { minHeight: '120px', marginTop: '8px' } });
    paragraphArea.value = game.paragraph;

    const save = el('button', { class: 'btn btn-primary', style: { width: '100%', marginTop: '16px' }, onclick: async () => {
      save.disabled = true;
      try {
        await apiFetch(`/games/${game.id}`, { method: 'PATCH', body: { paragraph: paragraphArea.value, difficulty: difficultySel.value } });
        closeModal();
        refreshGames();
        alert('Track updated successfully.');
      } catch (e) {
        alert(e?.message || String(e));
      } finally {
        save.disabled = false;
      }
    } }, ['SAVE']);

    const cancel = el('button', { class: 'btn btn-outline', style: { width: '100%', marginTop: '12px' , textTransform:'none'}, onclick: () => closeModal() }, ['CANCEL']);

    m.appendChild(el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700' } }, ['Difficulty']));
    m.appendChild(difficultySel);
    m.appendChild(el('label', { class: 'text-muted', style: { display: 'block', fontWeight: '700', marginTop: '12px' } }, ['Content']));
    m.appendChild(paragraphArea);
    m.appendChild(save);
    m.appendChild(cancel);

    modal.appendChild(m);
    document.body.appendChild(modal);
    modalRoot = modal;
  }

  container.appendChild(card);
  refreshGames();
  return container;
}

function renderNotFound() {
  const wrap = el('div', { style: { padding: '80px 16px', textAlign: 'center' } });
  wrap.appendChild(el('h1', { style: { fontSize: '48px', fontWeight: '900' } }, ['404']));
  wrap.appendChild(el('p', { class: 'text-muted' }, ['Page not found.']));
  return wrap;
}

async function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';

  root.appendChild(nav());

  // routes
  const path = state.route.path;

  if (path === '/') {
    const page = await renderHome();
    root.appendChild(page);
  } else if (path === '/auth') {
    root.appendChild(await renderAuth());
  } else if (path === '/game') {
    root.appendChild(await renderGame());
  } else if (path === '/leaderboard') {
    root.appendChild(await renderLeaderboard());
  } else if (path === '/history') {
    root.appendChild(await renderHistory());
  } else if (path === '/admin') {
    root.appendChild(await renderAdmin());
  } else if (/^\/results\/\d+$/.test(path)) {
    root.appendChild(await renderResults());
  } else {
    root.appendChild(renderNotFound());
  }
}

window.addEventListener('popstate', () => {
  state.route.path = location.pathname;
  render();
});

async function init() {
  state.route.path = location.pathname;
  await loadMe();
  await render();
}

init();

