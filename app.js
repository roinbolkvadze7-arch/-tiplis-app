(function () {
  'use strict';

  const PH = 'YOUR_SUPABASE_ANON_KEY';
  function cfg() {
    return window.__TIFLIS_CFG || {};
  }
  function supaUrl() {
    return (cfg().supabaseUrl || '').trim();
  }
  function supaKey() {
    return (cfg().supabaseAnonKey || '').trim();
  }

  let sb = null;
  const UNITS = ['კგ', 'გრ', 'ც', 'ლ', 'მლ', 'კომ', 'ბლ', 'მ'];
  let users = [],
    sellers = [],
    acts = [],
    curId = 1;
  let selectedSellerId = null;

  function escHtml(t) {
    return String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setDb(state, msg) {
    document.getElementById('db-dot').className = 'db-dot ' + state;
    document.getElementById('db-lbl').textContent = msg;
  }
  function load(v) {
    document.getElementById('lov').classList.toggle('on', v);
  }

  async function init() {
    load(true);
    if (!sb || !supaKey() || supaKey() === PH) {
      setDb('err', 'დააყენეთ Supabase');
      toast('⚠️ GitHub Secrets → SUPABASE_ANON_KEY (ან ლოკალურად config.js)');
      users = [];
      sellers = [];
      acts = [];
      curId = 1;
      renderUserSel();
      fillBuyer();
      addRow();
      load(false);
      return;
    }
    try {
      const [u, s, a] = await Promise.all([
        sb.from('users').select('*').order('id'),
        sb.from('sellers').select('*').order('id'),
        sb.from('acts').select('*').order('id', { ascending: false })
      ]);
      if (u.error || s.error || a.error) {
        const err = u.error || s.error || a.error;
        throw new Error(err.message || err.details || String(err.code || err.hint || 'API'));
      }
      users = u.data || [];
      sellers = s.data || [];
      acts = a.data || [];
      setDb('ok', 'Supabase ✓');
      curId = parseInt(localStorage.getItem('t_cur'), 10) || Number(users[0]?.id) || 1;
      if (users.length && !users.find((x) => String(x.id) === String(curId))) {
        curId = Number(users[0].id);
        localStorage.setItem('t_cur', String(curId));
      }
    } catch (e) {
      setDb('err', 'კავშირის შეცდომა');
      const detail = e && e.message ? String(e.message) : String(e);
      toast('⚠️ ' + detail.slice(0, 220));
      users = [];
      sellers = [];
      acts = [];
      curId = 1;
    }
    renderUserSel();
    fillBuyer();
    addRow();
    load(false);
  }

  function nav(v, btn) {
    document.querySelectorAll('.view').forEach((el) => el.classList.remove('on'));
    document.querySelectorAll('.nb').forEach((el) => el.classList.remove('on'));
    document.getElementById('view-' + v).classList.add('on');
    if (btn) btn.classList.add('on');
    if (v === 'sellers') renderSellers();
    if (v === 'users') renderUsers();
    if (v === 'acts') {
      renderActs();
      renderStats();
    }
  }

  function renderUserSel() {
    document.getElementById('cur-sel').innerHTML = users
      .map(
        (u) =>
          `<option value="${escHtml(u.id)}"${String(u.id) === String(curId) ? ' selected' : ''}>${escHtml(u.name)}</option>`
      )
      .join('');
  }
  function switchUser(id) {
    curId = Number(id);
    localStorage.setItem('t_cur', String(curId));
    fillBuyer();
    renderUsers();
    toast('შესული: ' + users.find((u) => String(u.id) === String(curId))?.name);
  }
  function fillBuyer() {
    const u = users.find((x) => String(x.id) === String(curId));
    if (u) {
      document.getElementById('buyer-name').value = u.name;
      document.getElementById('buyer-pid').value = u.pid;
      document.getElementById('sig-buyer').textContent = u.name;
    }
  }
  function renderUsers() {
    document.getElementById('uc').textContent = users.length;
    document.getElementById('users-body').innerHTML = users
      .map(
        (u, i) => `
    <tr><td>${i + 1}</td><td style="font-weight:600">${escHtml(u.name)}</td><td style="font-family:monospace;font-size:12px">${escHtml(u.pid)}</td>
    <td>${String(u.id) === String(curId) ? '<span class="badge b-green">შესული</span>' : '<span class="badge b-blue">მომხმარებელი</span>'}</td>
    <td><button type="button" class="bic" onclick="TiflisApp.switchUser(${u.id});TiflisApp.nav('act',document.getElementById('nb-act'))" title="შესვლა">🔐</button>
    <button type="button" class="bic" onclick="TiflisApp.deleteUser(${u.id})" title="წაშლა">🗑</button></td></tr>`
      )
      .join('');
  }
  async function saveUser() {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    const name = document.getElementById('nu-name').value.trim(),
      pid = document.getElementById('nu-pid').value.trim();
    if (!name || !pid) {
      toast('შეავსეთ ყველა ველი');
      return;
    }
    load(true);
    const { data, error } = await sb.from('users').insert([{ name, pid }]).select().single();
    load(false);
    if (error) {
      toast('შეცდომა: ' + error.message);
      return;
    }
    users.push(data);
    closeM('m-user');
    renderUserSel();
    renderUsers();
    toast('მომხმარებელი დამატებულია ✓');
    document.getElementById('nu-name').value = '';
    document.getElementById('nu-pid').value = '';
  }
  async function deleteUser(id) {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    if (String(id) === String(curId)) {
      toast('შესული მომხმარებლის წაშლა შეუძლებელია');
      return;
    }
    const { error } = await sb.from('users').delete().eq('id', id);
    if (error) {
      toast('შეცდომა: ' + error.message);
      return;
    }
    users = users.filter((x) => String(x.id) !== String(id));
    renderUserSel();
    renderUsers();
  }

  function renderSellers() {
    document.getElementById('sc').textContent = sellers.length;
    document.getElementById('sellers-body').innerHTML = sellers
      .map(
        (s, i) => `
    <tr><td>${i + 1}</td><td style="font-weight:600">${escHtml(s.name)}</td><td style="font-family:monospace;font-size:12px">${escHtml(s.pid)}</td>
    <td><button type="button" class="bic" onclick="TiflisApp.pickSeller(${s.id})" title="აქტში გამოყენება">✅</button>
    <button type="button" class="bic" onclick="TiflisApp.openEditSeller(${s.id})" title="რედაქტირება">✏️</button>
    <button type="button" class="bic" onclick="TiflisApp.delSeller(${s.id})" title="წაშლა">🗑</button></td></tr>`
      )
      .join('');
  }
  function openAddSeller() {
    document.getElementById('ns-id').value = '';
    document.getElementById('ns-name').value = '';
    document.getElementById('ns-pid').value = '';
    document.getElementById('m-seller-title').textContent = 'გამყიდველის დამატება';
    openM('m-seller');
  }
  function openEditSeller(id) {
    const s = sellers.find((x) => String(x.id) === String(id));
    if (!s) return;
    document.getElementById('ns-id').value = String(s.id);
    document.getElementById('ns-name').value = s.name;
    document.getElementById('ns-pid').value = s.pid;
    document.getElementById('m-seller-title').textContent = 'გამყიდველის რედაქტირება';
    openM('m-seller');
  }
  function closeSellerModal() {
    document.getElementById('ns-id').value = '';
    closeM('m-seller');
  }
  async function saveSeller() {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    const name = document.getElementById('ns-name').value.trim(),
      pid = document.getElementById('ns-pid').value.trim();
    const editId = document.getElementById('ns-id').value.trim();
    if (!name || !pid) {
      toast('შეავსეთ ყველა ველი');
      return;
    }
    load(true);
    let data, error;
    if (editId) {
      ({ data, error } = await sb.from('sellers').update({ name, pid }).eq('id', editId).select().single());
    } else {
      ({ data, error } = await sb.from('sellers').insert([{ name, pid }]).select().single());
    }
    load(false);
    if (error) {
      toast('შეცდომა: ' + error.message);
      return;
    }
    if (editId) {
      const ix = sellers.findIndex((x) => String(x.id) === String(editId));
      if (ix >= 0) sellers[ix] = data;
      if (String(selectedSellerId) === String(editId)) applySeller(data);
      toast('გამყიდველი განახლებულია ✓');
    } else {
      sellers.push(data);
      toast('გამყიდველი დამატებულია ✓');
    }
    closeSellerModal();
    document.getElementById('ns-name').value = '';
    document.getElementById('ns-pid').value = '';
    renderSellers();
  }
  async function delSeller(id) {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    const { error } = await sb.from('sellers').delete().eq('id', id);
    if (error) {
      toast('შეცდომა: ' + error.message);
      return;
    }
    sellers = sellers.filter((x) => String(x.id) !== String(id));
    renderSellers();
  }
  function pickSeller(id) {
    const s = sellers.find((x) => String(x.id) === String(id));
    if (s) {
      applySeller(s);
      nav('act', document.getElementById('nb-act'));
      toast('გამყიდველი შეირჩა ✓');
    }
  }

  function sSearch() {
    const q = document.getElementById('seller-inp').value.trim().toLowerCase();
    const dd = document.getElementById('sdrop');
    const m = q ? sellers.filter((s) => s.name.toLowerCase().includes(q)) : sellers;
    dd.innerHTML = !m.length
      ? '<div class="sopt nm">ვერ მოიძებნა</div>'
      : m
          .map(
            (s) =>
              `<div class="sopt" data-sid="${escHtml(s.id)}" onmousedown="TiflisApp.pickSellerFromDrop(event)"><div class="sn">${escHtml(s.name)}</div><div class="si">პ/ნ ${escHtml(s.pid)}</div></div>`
          )
          .join('');
    dd.style.display = 'block';
  }
  function pickSellerFromDrop(ev) {
    const el = ev && ev.currentTarget;
    if (!el) return;
    const id = el.getAttribute('data-sid');
    const s = sellers.find((x) => String(x.id) === String(id));
    if (s) applySeller(s);
  }
  function closeDrop() {
    document.getElementById('sdrop').style.display = 'none';
  }
  function applySeller(s) {
    selectedSellerId = s.id;
    document.getElementById('seller-inp').value = s.name;
    document.getElementById('seller-pid').value = s.pid;
    document.getElementById('sig-seller').textContent = s.name;
    closeDrop();
  }

  let rc = 0;
  function addRow() {
    rc++;
    const tr = document.createElement('tr');
    tr.id = 'r' + rc;
    const unitOpts = UNITS.map((u) => `<option>${u}</option>`).join('');
    tr.innerHTML = `
    <td class="tdn">${rc}</td>
    <td><input type="text" class="ni" placeholder="+ საქონლის დასახელება"></td>
    <td><select>${unitOpts}</select></td>
    <td><input type="number" class="qin" placeholder="0" min="0" step="any"></td>
    <td><input type="number" class="pin" placeholder="0.00" min="0" step="0.01"></td>
    <td><input type="text" class="lout" readonly placeholder="0"></td>
    <td><input type="text" class="tout" readonly placeholder="00"></td>
    <td class="del-td"><button type="button" class="del-btn" onclick="TiflisApp.delRow('r${rc}')" title="სტრიქონის წაშლა">×</button></td>`;
    document.getElementById('gtbody').appendChild(tr);
    tr.querySelector('.qin').addEventListener('input', () => calcRow(tr));
    tr.querySelector('.pin').addEventListener('input', () => calcRow(tr));
  }
  function delRow(id) {
    const tr = document.getElementById(id);
    if (tr) {
      tr.remove();
      calcGrand();
    }
  }
  function calcRow(tr) {
    const q = parseFloat(tr.querySelector('.qin').value) || 0;
    const p = parseFloat(tr.querySelector('.pin').value) || 0;
    const t = Math.round(q * p * 100) / 100;
    const l = Math.floor(t),
      tt = Math.round((t - l) * 100);
    tr.querySelector('.lout').value = l > 0 ? l : '';
    tr.querySelector('.tout').value = l > 0 || tt > 0 ? String(tt).padStart(2, '0') : '';
    calcGrand();
  }
  function calcGrand() {
    let g = 0;
    document.querySelectorAll('#gtbody tr').forEach((tr) => {
      const q = parseFloat(tr.querySelector('.qin')?.value) || 0;
      const p = parseFloat(tr.querySelector('.pin')?.value) || 0;
      g += q * p;
    });
    g = Math.round(g * 100) / 100;
    const l = Math.floor(g),
      t = Math.round((g - l) * 100);
    document.getElementById('g-lari').textContent = l.toLocaleString('ka-GE');
    document.getElementById('g-tetri').textContent = String(t).padStart(2, '0');
    document.getElementById('words-out').textContent = toWords(g);
    return g;
  }

  async function saveAct() {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    const day = document.getElementById('act-day').value.trim();
    const month = document.getElementById('act-month').value.trim();
    const year = document.getElementById('act-year').value.trim();
    const buyerName = document.getElementById('buyer-name').value.trim();
    const buyerPid = document.getElementById('buyer-pid').value.trim();
    const sellerName = document.getElementById('seller-inp').value.trim();
    const sellerPid = document.getElementById('seller-pid').value.trim();

    if (!day || !month || !year) {
      toast('შეავსეთ თარიღი (დღე / თვე / წელი)');
      return;
    }
    if (!buyerName || !buyerPid) {
      toast('აირჩიეთ მყიდველი');
      return;
    }
    if (!sellerName) {
      toast('შეარჩიეთ გამყიდველი');
      return;
    }

    const goods = [];
    let total = 0;
    document.querySelectorAll('#gtbody tr').forEach((tr) => {
      const name = tr.querySelector('.ni')?.value.trim();
      const unit = tr.querySelector('select')?.value;
      const qty = parseFloat(tr.querySelector('.qin')?.value) || 0;
      const price = parseFloat(tr.querySelector('.pin')?.value) || 0;
      if (name) {
        const sum = Math.round(qty * price * 100) / 100;
        total += sum;
        goods.push({ name, unit, qty, price, sum });
      }
    });
    total = Math.round(total * 100) / 100;

    if (!goods.length) {
      toast('დაამატეთ მინიმუმ ერთი საქონელი');
      return;
    }

    const managerName = document.getElementById('sig-manager').value.trim();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    load(true);
    const { data, error } = await sb
      .from('acts')
      .insert([
        {
          act_date: dateStr,
          display_date: `${day}/${month}/${year}`,
          buyer_name: buyerName,
          buyer_pid: buyerPid,
          seller_name: sellerName,
          seller_pid: sellerPid,
          manager_name: managerName,
          goods: goods,
          total: total,
          total_words: toWords(total)
        }
      ])
      .select()
      .single();
    load(false);
    if (error) {
      toast('შენახვის შეცდომა: ' + error.message);
      return;
    }
    acts.unshift(data);
    toast('აქტი #' + data.id + ' შენახულია Supabase-ში ✓');
    clearAct();
  }

  function clearAct() {
    selectedSellerId = null;
    ['act-day', 'act-month'].forEach((id) => (document.getElementById(id).value = ''));
    document.getElementById('act-year').value = '2026';
    document.getElementById('seller-inp').value = '';
    document.getElementById('seller-pid').value = '';
    document.getElementById('sig-seller').textContent = '—';
    document.getElementById('sig-manager').value = '';
    document.getElementById('gtbody').innerHTML = '';
    rc = 0;
    addRow();
    calcGrand();
  }

  function renderActs() {
    const fSeller = document.getElementById('f-seller').value.trim().toLowerCase();
    const fBuyer = document.getElementById('f-buyer').value.trim().toLowerCase();
    const fFrom = document.getElementById('f-from').value;
    const fTo = document.getElementById('f-to').value;
    const fMin = parseFloat(document.getElementById('f-min').value) || 0;
    const fMax = parseFloat(document.getElementById('f-max').value) || Infinity;

    const filtered = [...acts].reverse().filter((a) => {
      if (fSeller && !(a.seller_name || a.sellerName || '').toLowerCase().includes(fSeller)) return false;
      if (fBuyer && !(a.buyer_name || a.buyerName || '').toLowerCase().includes(fBuyer)) return false;
      if (fFrom && (a.act_date || a.date) < fFrom) return false;
      if (fTo && (a.act_date || a.date) > fTo) return false;
      if (a.total < fMin) return false;
      if (a.total > fMax) return false;
      return true;
    });

    document.getElementById('act-cnt').textContent = filtered.length;
    const tb = document.getElementById('acts-body');
    const empty = document.getElementById('acts-empty');

    if (!filtered.length) {
      tb.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    tb.innerHTML = filtered
      .map(
        (a, i) => `
    <tr class="act-row" onclick="TiflisApp.viewAct(${a.id})">
      <td>${filtered.length - i}</td>
      <td><span class="badge b-blue">#${a.id}</span></td>
      <td>${escHtml(a.display_date || a.displayDate)}</td>
      <td style="font-size:12px">${escHtml(a.buyer_name || a.buyerName)}</td>
      <td style="font-weight:600">${escHtml(a.seller_name || a.sellerName)}</td>
      <td class="act-sum">${parseFloat(a.total).toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾</td>
      <td onclick="event.stopPropagation()">
        <button type="button" class="bic" onclick="TiflisApp.viewAct(${a.id})" title="ნახვა">👁</button>
        <button type="button" class="bic" onclick="TiflisApp.printAct(${a.id})" title="დაბეჭდვა">🖨</button>
        <button type="button" class="bic" onclick="TiflisApp.deleteAct(${a.id})" title="წაშლა">🗑</button>
      </td>
    </tr>`
      )
      .join('');
  }

  function renderStats() {
    if (!acts.length) {
      document.getElementById('acts-stats').innerHTML = '';
      return;
    }
    const total = acts.reduce((s, a) => s + parseFloat(a.total), 0);
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthActs = acts.filter((a) => (a.act_date || a.date || '').startsWith(thisMonth));
    const monthTotal = monthActs.reduce((s, a) => s + parseFloat(a.total), 0);
    document.getElementById('acts-stats').innerHTML = `
    <div class="stat-card"><div class="stl">სულ აქტები</div><div class="stv">${acts.length}</div><div class="sts">ყველა დრო</div></div>
    <div class="stat-card"><div class="stl">სულ თანხა</div><div class="stv">${total.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ₾</div><div class="sts">ყველა აქტი</div></div>
    <div class="stat-card"><div class="stl">ამ თვის აქტები</div><div class="stv">${monthActs.length}</div><div class="sts">${thisMonth}</div></div>
    <div class="stat-card"><div class="stl">ამ თვის თანხა</div><div class="stv">${monthTotal.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ₾</div><div class="sts">მიმდინარე თვე</div></div>`;
  }

  function clearFilters() {
    ['f-seller', 'f-buyer', 'f-from', 'f-to', 'f-min', 'f-max'].forEach((id) => (document.getElementById(id).value = ''));
    renderActs();
  }

  const O = [
    '', 'ერთი', 'ორი', 'სამი', 'ოთხი', 'ხუთი', 'ექვსი', 'შვიდი', 'რვა', 'ცხრა', 'ათი',
    'თერთმეტი', 'თორმეტი', 'ცამეტი', 'თოთხმეტი', 'თხუთმეტი', 'თექვსმეტი', 'ჩვიდმეტი', 'თვრამეტი', 'ცხრამეტი'
  ];
  const H = ['', 'ასი', 'ორასი', 'სამასი', 'ოთხასი', 'ხუთასი', 'ექვსასი', 'შვიდასი', 'რვაასი', 'ცხრაასი'];
  function n2w(n) {
    if (n === 0) return 'ნული';
    if (n < 20) return O[n];
    if (n < 100) {
      const t = Math.floor(n / 10),
        o = n % 10;
      const tb = ['', '', 'ოცი', 'ოცდაათი', 'ორმოცი', 'ორმოცდაათი', 'სამოცი', 'სამოცდაათი', 'ოთხმოცი', 'ოთხმოცდაათი'];
      if (o === 0) return tb[t];
      const pb = ['', '', 'ოცდა', 'ოცდა', 'ორმოცდა', 'ორმოცდა', 'სამოცდა', 'სამოცდა', 'ოთხმოცდა', 'ოთხმოცდა'];
      const add = [0, 0, 0, 10, 0, 10, 0, 10, 0, 10];
      return pb[t] + (add[t] ? n2w(add[t] + o) : O[o]);
    }
    if (n < 1000) {
      const h = Math.floor(n / 100),
        r = n % 100;
      return H[h] + (r ? ' ' + n2w(r) : '');
    }
    if (n < 1000000) {
      const k = Math.floor(n / 1000),
        r = n % 1000;
      return (k === 1 ? 'ათასი' : n2w(k) + ' ათასი') + (r ? ' ' + n2w(r) : '');
    }
    const m = Math.floor(n / 1e6),
      r = n % 1e6;
    return (m === 1 ? 'მილიონი' : n2w(m) + ' მილიონი') + (r ? ' ' + n2w(r) : '');
  }
  function toWords(amt) {
    if (!amt || amt <= 0) return '— შეავსეთ საქონლის ჩამონათვალი —';
    const l = Math.floor(amt),
      t = Math.round((amt - l) * 100);
    let w = n2w(l) + ' ლარი' + (t > 0 ? ' და ' + n2w(t) + ' თეთრი' : '');
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function buildActHTML(a) {
    const goodsArr = Array.isArray(a.goods) ? a.goods : [];
    const rows = goodsArr
      .map((g, i) => {
        const pr = Number(g.price);
        return `
    <tr>
      <td style="text-align:center;color:#94a3b8;font-size:11px;padding:7px 5px">${i + 1}</td>
      <td style="padding:7px 8px">${escHtml(g.name)}</td>
      <td style="text-align:center;padding:7px 5px">${escHtml(g.unit)}</td>
      <td style="text-align:center;padding:7px 5px">${escHtml(g.qty)}</td>
      <td style="text-align:center;padding:7px 5px">${pr.toLocaleString('ka-GE', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:center;font-weight:700;padding:7px 5px">${Math.floor(Number(g.sum))}</td>
      <td style="text-align:center;font-weight:700;padding:7px 5px">${String(Math.round((Number(g.sum) - Math.floor(Number(g.sum))) * 100)).padStart(2, '0')}</td>
    </tr>`;
      })
      .join('');
    const dd = a.display_date || a.displayDate;
    const bn = a.buyer_name || a.buyerName;
    const bp = a.buyer_pid || a.buyerPid;
    const sn = a.seller_name || a.sellerName;
    const sp = a.seller_pid || a.sellerPid;
    const mn = a.manager_name || a.managerName || '';
    const tw = a.total_words || a.totalWords || toWords(parseFloat(a.total));
    const lari = Math.floor(parseFloat(a.total));
    const tetri = String(Math.round((parseFloat(a.total) - lari) * 100)).padStart(2, '0');
    return `
    <div style="background:#1e293b;padding:20px 28px;text-align:center;border-radius:8px 8px 0 0">
      <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:.8px">შესყიდვის აქტი</div>
      <div style="font-size:10px;color:#475569;margin-top:3px">PURCHASE ACT — შპს „ტიფლისი" (ს/კ 445575011)</div>
    </div>
    <div style="padding:20px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
      <div style="background:#f8fafc;padding:9px 14px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:16px;font-size:13px;color:#374151;font-weight:500">
        ქ. ბათუმი &nbsp;&nbsp; ${escHtml(dd)} წელი
      </div>
      <div style="font-size:13px;line-height:2.1;color:#374151;margin-bottom:18px">
        ჩვენ ერთის მხრივ შპს „ტიფლისი" (ს/კ 445575011) წარმოდგენილი <strong>${escHtml(bn)}</strong> პ/ნ ${escHtml(bp)} სახით, შემდგომში <strong>მყიდველი</strong> და მეორეს მხრივ ფიზიკური პირი <strong>${escHtml(sn)}</strong> (პირადი #${escHtml(sp || '—')}) შემდგომში <strong>გამყიდველი</strong>, შევადგინეთ წინამდებარე შესყიდვის აქტი, რომლითაც ვადასტურებთ რომ გამყიდველმა გაყიდა, ხოლო მყიდველმა შეიძინა შემდეგი დასახელების საქონელი:
      </div>
      <div style="overflow-x:auto;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:14px">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#1e293b;color:#f8fafc">
              <th style="padding:9px 5px;text-align:center;font-size:10px;border-right:1px solid #334155">#</th>
              <th style="padding:9px 8px;text-align:left;font-size:10px;border-right:1px solid #334155">საქონლის დასახელება</th>
              <th style="padding:9px 5px;text-align:center;font-size:10px;border-right:1px solid #334155">ზომის ერთ.</th>
              <th style="padding:9px 5px;text-align:center;font-size:10px;border-right:1px solid #334155">რაოდ.</th>
              <th style="padding:9px 5px;text-align:center;font-size:10px;border-right:1px solid #334155">შეს. ფასი</th>
              <th style="padding:9px 5px;text-align:center;font-size:10px;border-right:1px solid #334155">ლარი</th>
              <th style="padding:9px 5px;text-align:center;font-size:10px">თეთრი</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f8fafc">
              <td colspan="5" style="text-align:right;padding:10px 12px;font-weight:700;font-size:13px;border-top:2px solid #e2e8f0">სულ თანხა:</td>
              <td style="text-align:center;font-weight:700;font-size:14px;border-top:2px solid #e2e8f0">${lari.toLocaleString('ka-GE')}</td>
              <td style="text-align:center;font-weight:700;font-size:14px;border-top:2px solid #e2e8f0">${tetri}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin-bottom:20px">
        <div style="font-size:9px;font-weight:700;color:#059669;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:3px">სულ თანხა სიტყვიერად</div>
        <div style="font-size:14px;font-weight:600;color:#065f46">${escHtml(tw)}</div>
      </div>
      <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1.5px solid #e2e8f0">ხელმოწერები</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px">
        <div>
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px">თანხა გადაიხადა (მყიდველი)</div>
          <div style="font-size:13px;font-weight:600;color:#1e293b;padding-bottom:7px;border-bottom:2px solid #cbd5e1;min-height:28px">${escHtml(bn)}</div>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px">თანხა მიიღო (გამყიდველი)</div>
          <div style="font-size:13px;font-weight:600;color:#1e293b;padding-bottom:7px;border-bottom:2px solid #cbd5e1;min-height:28px">${escHtml(sn)}</div>
        </div>
        <div>
          <div style="font-size:9px;font-weight:700;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px">ხელმძღვანელი</div>
          <div style="font-size:13px;font-weight:600;color:#1e293b;padding-bottom:7px;border-bottom:2px solid #cbd5e1;min-height:28px">${escHtml(mn)}</div>
        </div>
      </div>
    </div>`;
  }

  function viewAct(id) {
    const a = acts.find((x) => String(x.id) === String(id));
    if (!a) return;
    document.getElementById('mv-title').textContent = 'შესყიდვის აქტი #' + a.id + ' — ' + (a.display_date || a.displayDate);
    document.getElementById('mv-body').innerHTML = buildActHTML(a);
    document.getElementById('mv-del-btn').onclick = () => {
      if (confirm('აქტი #' + a.id + ' წაიშლება?')) {
        deleteAct(id);
        closeM('m-view-act');
      }
    };
    document.getElementById('mv-print-btn').onclick = () => printAct(id);
    openM('m-view-act');
  }

  function printAct(id) {
    const a = acts.find((x) => String(x.id) === String(id));
    if (!a) return;
    const html = `<!DOCTYPE html><html lang="ka"><head><meta charset="UTF-8">
    <title>შესყიდვის აქტი #${a.id}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Noto Sans Georgian',sans-serif;padding:14mm;color:#1e293b;background:#fff;}
      @page{size:A4;margin:12mm 14mm;}
@media print{body{padding:0;}}
    </style>
    </head><body>${buildActHTML(a)}</body></html>`;
    const w = window.open('', '_blank', 'width=860,height=1100');
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (_) {}
    }, 250);
  }

  async function deleteAct(id) {
    if (!sb) {
      toast('Supabase არ არის კონფიგურირებული');
      return;
    }
    const { error } = await sb.from('acts').delete().eq('id', id);
    if (error) {
      toast('შეცდომა');
      return;
    }
    acts = acts.filter((x) => String(x.id) !== String(id));
    renderActs();
    renderStats();
    toast('აქტი წაიშალა');
  }

  function openM(id) {
    document.getElementById(id).classList.add('on');
  }
  function closeM(id) {
    document.getElementById(id).classList.remove('on');
  }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('on');
    setTimeout(() => t.classList.remove('on'), 2500);
  }

  window.TiflisApp = {
    nav,
    switchUser,
    saveUser,
    deleteUser,
    openAddSeller,
    openEditSeller,
    closeSellerModal,
    saveSeller,
    delSeller,
    pickSeller,
    sSearch,
    pickSellerFromDrop,
    closeDrop,
    addRow,
    delRow,
    saveAct,
    clearAct,
    clearFilters,
    renderActs,
    viewAct,
    printAct,
    deleteAct,
    openM,
    closeM
  };

  async function boot() {
    for (let i = 0; i < 60; i++) {
      if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') break;
      await new Promise((r) => setTimeout(r, 50));
    }
    const url = supaUrl();
    const key = supaKey();
    sb =
      typeof supabase !== 'undefined' && typeof supabase.createClient === 'function' && url
        ? supabase.createClient(url, key || PH)
        : null;
    await init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
