// DOM要素の取得
const itemForm = document.getElementById('itemForm');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemAmountInput = document.getElementById('itemAmount');
const unitBaseSelect = document.getElementById('unitBase');
const errorMessage = document.getElementById('errorMessage');
const emptyMessage = document.getElementById('emptyMessage');
const itemList = document.getElementById('itemList');
const resetFormBtn = document.getElementById('resetFormBtn');
const clearListBtn = document.getElementById('clearListBtn');

// 履歴用のDOM要素
const historyTitleInput = document.getElementById('historyTitle');
const saveHistoryBtn = document.getElementById('saveHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const emptyHistoryMessage = document.getElementById('emptyHistoryMessage');
const historyList = document.getElementById('historyList');

const STORAGE_KEY = 'cospa_app_history';

// データ管理
let items = [];
let itemCounter = 1;
let histories = loadHistories();

// 初期化
createBgCats();
renderHistories();

// 背景のふわふわ猫＆肉球を生成
function createBgCats() {
  const bgCats = document.getElementById('bgCats');
  if (!bgCats) return;

  const configs = [
    { icon: '🐾', left: '8%',  dur: '13s', delay: '0s', size: '1.8rem' },
    { icon: '🐱', left: '24%', dur: '17s', delay: '3s', size: '2.4rem' },
    { icon: '🐾', left: '45%', dur: '14s', delay: '6s', size: '1.6rem' },
    { icon: '🐾', left: '68%', dur: '16s', delay: '1s', size: '2.1rem' },
    { icon: '🐱', left: '84%', dur: '15s', delay: '4s', size: '2.5rem' },
    { icon: '🐾', left: '93%', dur: '12s', delay: '8s', size: '1.7rem' }
  ];

  configs.forEach(c => {
    const span = document.createElement('span');
    span.className = 'float-item';
    span.textContent = c.icon;
    span.style.left = c.left;
    span.style.animationDuration = c.dur;
    span.style.animationDelay = c.delay;
    span.style.fontSize = c.size;
    bgCats.appendChild(span);
  });
}

// フォーム送信時の処理（リストに追加）
itemForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = itemNameInput.value.trim() || `商品 ${itemCounter}`;
  const price = Number(itemPriceInput.value);
  const amount = Number(itemAmountInput.value);
  const base = Number(unitBaseSelect.value);

  if (!price || !amount || price <= 0 || amount <= 0) {
    errorMessage.textContent = '価格と内容量には0より大きい数値を入力してください。';
    return;
  }

  errorMessage.textContent = '';

  const unitPrice = Math.round((price / amount) * base * 100) / 100;

  items.push({
    id: Date.now(),
    name: name,
    price: price,
    amount: amount,
    base: base,
    unitPrice: unitPrice
  });

  itemCounter++;

  itemNameInput.value = '';
  itemPriceInput.value = '';
  itemAmountInput.value = '';
  itemNameInput.focus();

  renderList();
  playAddSound();
});

// 入力クリア（フォームの中身だけ消す）
resetFormBtn.addEventListener('click', function () {
  itemNameInput.value = '';
  itemPriceInput.value = '';
  itemAmountInput.value = '';
  errorMessage.textContent = '';
  itemNameInput.focus();
  playDeleteSound();
});

// 比較リストを全削除
clearListBtn.addEventListener('click', function () {
  if (items.length === 0) return;

  if (confirm('比較リストをすべて削除します。本当によろしいですか？')) {
    playClearSound();
    items = [];
    itemCounter = 1;
    errorMessage.textContent = '';
    renderList();
  }
});

// 履歴に保存（タイトル付き）
saveHistoryBtn.addEventListener('click', function () {
  if (items.length === 0) {
    errorMessage.textContent = '履歴に保存する商品を1つ以上追加してください。';
    return;
  }

  errorMessage.textContent = '';

  const title = historyTitleInput.value.trim() || '無題の比較';
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const minUnitPrice = Math.min(...items.map(item => item.unitPrice));

  const newRecord = {
    id: Date.now(),
    title: title,
    date: dateStr,
    minUnitPrice: minUnitPrice,
    items: items.map(item => ({ ...item }))
  };

  histories.unshift(newRecord);
  historyTitleInput.value = '';
  saveHistories();
  renderHistories();
  playSaveSound();
});

// 履歴を全削除
clearHistoryBtn.addEventListener('click', function () {
  if (histories.length === 0) return;

  if (confirm('保存された履歴をすべて削除します。本当によろしいですか？')) {
    playClearSound();
    histories = [];
    saveHistories();
    renderHistories();
  }
});

// 比較リストの描画
function renderList() {
  itemList.innerHTML = '';

  if (items.length === 0) {
    emptyMessage.style.display = 'block';
    return;
  }

  emptyMessage.style.display = 'none';

  const minUnitPrice = Math.min(...items.map(item => item.unitPrice));

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'item-card';

    const isBest = items.length >= 2 && item.unitPrice === minUnitPrice;
    if (isBest) {
      li.classList.add('best');
    }

    const baseLabel = item.base === 100 ? '100あたり' : '1あたり';
    const badgeHtml = isBest ? '<span class="best-badge">一番お得！</span>' : '';

    li.innerHTML = `
      <div class="item-info">
        <h3>${escapeHtml(item.name)}${badgeHtml}</h3>
        <p class="item-meta">${item.price}円 / ${item.amount}</p>
      </div>
      <div class="item-right">
        <div class="unit-price">${item.unitPrice.toFixed(2)}円<br><small style="font-size:0.75rem;font-weight:normal;">(${baseLabel})</small></div>
        <button type="button" class="delete-btn">削除</button>
      </div>
    `;

    li.querySelector('.delete-btn').addEventListener('click', function () {
      playDeleteSound();
      li.classList.add('removing');
      setTimeout(function () {
        items = items.filter(target => target.id !== item.id);
        renderList();
      }, 250);
    });

    itemList.appendChild(li);
  });
}

// 履歴リストの描画
function renderHistories() {
  historyList.innerHTML = '';

  if (histories.length === 0) {
    emptyHistoryMessage.style.display = 'block';
    return;
  }

  emptyHistoryMessage.style.display = 'none';

  histories.forEach(function (record) {
    const li = document.createElement('li');
    li.className = 'history-card';

    const itemsHtml = record.items.map(function (item) {
      const isBest = record.items.length >= 2 && item.unitPrice === record.minUnitPrice;
      const bestMark = isBest ? ' ★一番お得' : '';
      const cls = isBest ? ' class="best-text"' : '';
      const baseLabel = item.base === 100 ? '100あたり' : '1あたり';
      return `<li${cls}>${escapeHtml(item.name)}：${item.unitPrice.toFixed(2)}円（${baseLabel}） / ${item.price}円・${item.amount}${bestMark}</li>`;
    }).join('');

    const displayTitle = record.title ? escapeHtml(record.title) : '無題の比較';

    li.innerHTML = `
      <div class="history-top">
        <div>
          <p class="history-title">${displayTitle}</p>
          <span class="history-date">保存日時：${record.date}</span>
        </div>
        <div class="history-actions">
          <button type="button" class="delete-btn">削除</button>
          <button type="button" class="load-btn">編集</button>
        </div>
      </div>
      <ul class="history-items">
        ${itemsHtml}
      </ul>
    `;

    // 履歴を比較リストに読み込んで再利用
    li.querySelector('.load-btn').addEventListener('click', function () {
      items = record.items.map((item, idx) => ({
        ...item,
        id: Date.now() + idx
      }));
      itemCounter = items.length + 1;
      historyTitleInput.value = record.title || '';
      renderList();
      playSaveSound();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 履歴の個別削除
    li.querySelector('.delete-btn').addEventListener('click', function () {
      playDeleteSound();
      li.classList.add('removing');
      setTimeout(function () {
        histories = histories.filter(target => target.id !== record.id);
        saveHistories();
        renderHistories();
      }, 250);
    });

    historyList.appendChild(li);
  });
}

// localStorageへJSON形式で保存
function saveHistories() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
}

// localStorageから読み込み
function loadHistories() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// XSS対策
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 共通の音を鳴らすベース関数
function playTone(freqs, duration = 0.08, type = 'sine', volume = 0.15) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  freqs.forEach((freq, index) => {
    osc.frequency.setValueAtTime(freq, now + index * duration);
  });

  const totalTime = freqs.length * duration + 0.12;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + totalTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + totalTime);
}

function playAddSound() {
  playTone([659.25, 987.77]);
}

function playSaveSound() {
  playTone([523.25, 659.25, 783.99], 0.07);
}

function playDeleteSound() {
  playTone([987.77, 659.25], 0.06, 'sine', 0.12);
}

function playClearSound() {
  playTone([392.00, 261.63], 0.09, 'triangle', 0.15);
}

// 右下の猫：クリックで表情チェンジ＋吹き出し＋鳴き声
const peekCat = document.getElementById('peekCat');
const catSpeech = document.getElementById('catSpeech');
const catFaces = ['faceNormal', 'faceHappy', 'faceLove', 'faceSurprised'];
const catMessages = [
  'にゃー♪',
  'おトクみつけた！',
  '節約えらいにゃ！',
  'なでてくれてありがとう♥',
  '安い方えらぼ〜！'
];
let currentFaceIndex = 0;
let speechTimer = null;

if (peekCat) {
  peekCat.addEventListener('click', function () {
    playMeowSound();

    // 表情を順番に切り替え
    document.getElementById(catFaces[currentFaceIndex]).style.display = 'none';
    currentFaceIndex = (currentFaceIndex + 1) % catFaces.length;
    document.getElementById(catFaces[currentFaceIndex]).style.display = 'block';

    // ジャンプアニメーション
    peekCat.classList.remove('jump');
    void peekCat.offsetWidth;
    peekCat.classList.add('jump');

    // ランダムな吹き出しを表示（2秒後に消える）
    if (catSpeech) {
      const msg = catMessages[Math.floor(Math.random() * catMessages.length)];
      catSpeech.textContent = msg;
      catSpeech.classList.add('show');
      clearTimeout(speechTimer);
      speechTimer = setTimeout(() => {
        catSpeech.classList.remove('show');
      }, 2000);
    }
  });
}

// 猫の鳴き声っぽい音（にゃー♪）
function playMeowSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1050, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.35);

  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.38);
}