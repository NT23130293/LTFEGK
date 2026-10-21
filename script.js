'use strict';
function createWalls(config) {
  const blocked = new Set();
  if (config.mechanic !== 'cross') return blocked;
  const centerRow = 1 + Math.floor((config.rows - 1) / 2);
  const leftCenterCol = 1 + Math.floor((config.cols - 1) / 2);
  const rightCenterCol = leftCenterCol + 1;
  for (let c = leftCenterCol - 1; c <= rightCenterCol + 1; c++) {
    blocked.add(cellKey({ r: centerRow, c }));
  }
  for (let r = centerRow - 1; r <= centerRow + 1; r++) {
    blocked.add(cellKey({ r, c: leftCenterCol }));
    blocked.add(cellKey({ r, c: rightCenterCol }));
  }
  return blocked;
}

function buildBoard(config) {
  const board = Array.from({ length: config.rows + 2 }, () => Array(config.cols + 2).fill(null));
  const blocked = createWalls(config);
  const bag = [];
  for (let i = 0; i < (config.rows * config.cols - blocked.size) / 2; i++) bag.push(i % config.types, i % config.types);
  const values = shuffled(bag);
  for (let r = 1, i = 0; r <= config.rows; r++) {
    for (let c = 1; c <= config.cols; c++) {
      if (!blocked.has(cellKey({ r, c }))) board[r][c] = values[i++];
    }
  }
  const frozenCells = config.mechanic === 'ice'
    ? createWalls({ ...config, mechanic: 'cross' }) : new Set();
  return { board, blocked, frozenCells };
}

function say(message) { const element = $('message'); if (element) element.textContent = message; }

function updateStats() {
  const time = Math.max(0, Math.ceil(seconds));
  $('timer').textContent = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
  $('score').textContent = points;
}

function render() {
  const config = LEVELS[level];
  const board = $('board');
  board.style.setProperty('--cols', config.cols);
  board.replaceChildren();
  for (let r = 1; r <= config.rows; r++) {
    for (let c = 1; c <= config.cols; c++) {
      const value = grid[r][c];
      const isWall = walls.has(cellKey({ r, c }));
      const isFrozen = value !== null && frozen.has(cellKey({ r, c }));
      const isFogged = config.mechanic === 'fog' && !revealed.has(cellKey({ r, c }));
      const button = document.createElement('button');
      button.type = 'button';
      button.className = isWall ? 'tile wall' : value === null ? 'tile empty' : 'tile';
      button.dataset.r = r;
      button.dataset.c = c;
      button.disabled = isWall || isFrozen || value === null;
      if (isFrozen) button.classList.add('frozen');
      button.setAttribute('aria-pressed', String(Boolean(selected && sameCell(selected, { r, c }))));
      if (selected && sameCell(selected, { r, c })) button.classList.add('selected');
      if (isWall) {
        button.setAttribute('aria-label', 'Tường đá, vật cản');
      } else if (value !== null) {
        const pokemon = POKEMON[value];
        if (isFogged) {
          button.classList.add('fogged');
        } else {
          const image = document.createElement('img');
          image.src = pokemon.image;
          image.alt = '';
          image.draggable = false;
          button.append(image);
        }
        button.setAttribute('aria-label', `${isFogged ? 'Ô bị sương mù che' : pokemon.name}, hàng ${r}, cột ${c}${isFrozen ? ', đang đóng băng' : ''}`);
        button.addEventListener('click', () => selectTile({ r, c }));
      } else button.setAttribute('aria-label', 'Ô trống');
      board.append(button);
    }
  }
  updateStats();
}
function applyMovement() {
  const { rows, cols, mechanic } = LEVELS[level];
  if (mechanic === 'split') {
    const middle = Math.floor(cols / 2);
    for (let r = 1; r <= rows; r++) {
      let write = 1;
      for (let c = 1; c <= middle; c++) {
        if (grid[r][c] !== null) {
          const value = grid[r][c];
          grid[r][c] = null;
          grid[r][write++] = value;
        }
      }
      write = cols;
      for (let c = cols; c > middle; c--) {
        if (grid[r][c] !== null) {
          const value = grid[r][c];
          grid[r][c] = null;
          grid[r][write--] = value;
        }
      }
    }
    return;
  }
  if (mechanic === 'down') {
    for (let c = 1; c <= cols; c++) {
      let write = rows;
      for (let r = rows; r >= 1; r--) {
        if (grid[r][c] !== null) {
          const value = grid[r][c];
          grid[r][c] = null;
          grid[write--][c] = value;
        }
      }
    }
    return;
  }
  if (mechanic !== 'right') return;
  for (let r = 1; r <= rows; r++) {
    let write = cols;
    for (let c = cols; c >= 1; c--) {
      if (grid[r][c] !== null) {
        const value = grid[r][c];
        grid[r][c] = null;
        grid[r][write--] = value;
      }
    }
  }
}

function selectTile(position) {
  if (!active || paused || busy || grid[position.r][position.c] === null || walls.has(cellKey(position)) || frozen.has(cellKey(position))) return;
  if (LEVELS[level].mechanic === 'fog') {
    selectFogTile(position);
    return;
  }
  selectNormalTile(position);
}

function selectFogTile(position) {
  const key = cellKey(position);
  if (!selected) {
    revealed.add(key);
    selected = position;
    render();
    return;
  }
  if (sameCell(selected, position)) {
    revealed.delete(key);
    selected = null;
    render();
    return;
  }
  const first = selected;
  revealed.add(key);
  render();
  const path = grid[first.r][first.c] === grid[position.r][position.c]
    ? findPath(grid, first, position, walls) : null;
  if (path) {
    completeMatch(first, position, path);
    return;
  }
  busy = true;
  selected = null;
  tileAt(first).classList.add('wrong');
  tileAt(position).classList.add('wrong');
  const thisSession = session;
  const hide = () => {
    if (thisSession !== session || !active) return;
    if (paused) { window.setTimeout(hide, 100); return; }
    revealed.delete(cellKey(first));
    revealed.delete(key);
    busy = false;
    render();
  };
  window.setTimeout(hide, 700);
}

function thawIceBeside(first, second) {
  const config = LEVELS[level];
  const centerRow = 1 + Math.floor((config.rows - 1) / 2);
  const leftCenterCol = 1 + Math.floor((config.cols - 1) / 2);
  for (const position of [first, second]) {
    const corner = Math.abs(position.r - centerRow) === 1 &&
      (position.c === leftCenterCol - 1 || position.c === leftCenterCol + 2);
    for (const [dr, dc] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (frozen.delete(cellKey({ r: position.r + dr, c: position.c + dc })) && corner) break;
    }
  }
}

function completeMatch(first, second, path) {
  busy = true;
  deselect();
  tileAt(first).classList.add('matched');
  tileAt(second).classList.add('matched');
  drawPath(path);
  const thisSession = session;
  const commit = () => {
    if (thisSession !== session || !active) return;
    if (paused) { window.setTimeout(commit, 100); return; }
    grid[first.r][first.c] = null;
    grid[second.r][second.c] = null;
    revealed.delete(cellKey(first));
    revealed.delete(cellKey(second));
    points += 100;
    if (LEVELS[level].mechanic === 'ice') thawIceBeside(first, second);
    applyMovement();
    clearPath();
    busy = false;
    if (!getTilePositions().length) { render(); finish(true); return; }
    if (!findMoves(grid, walls, frozen, true).length) {
      say(reshuffle() ? 'Hết nước nối — bàn đã tự xáo miễn phí.' : 'Không tìm được nước nối. Hãy chơi lại màn.');
    } else say('Đã nối một cặp! +100 điểm.');
    render();
  };
  window.setTimeout(commit, 260);
}


const POKEMON = [
  { name: 'Pikachu', image: 'assets/pokemon/pikachu.png' },
  { name: 'Bulbasaur', image: 'assets/pokemon/bulbasaur.png' },
  { name: 'Charmander', image: 'assets/pokemon/charmander.png' },
  { name: 'Squirtle', image: 'assets/pokemon/squirtle.png' },
  { name: 'Jigglypuff', image: 'assets/pokemon/jigglypuff.png' },
  { name: 'Meowth', image: 'assets/pokemon/meowth.png' },
  { name: 'Psyduck', image: 'assets/pokemon/psyduck.png' },
  { name: 'Eevee', image: 'assets/pokemon/eevee.png' },
  { name: 'Snorlax', image: 'assets/pokemon/snorlax.png' },
  { name: 'Gengar', image: 'assets/pokemon/gengar.png' },
  { name: 'Vulpix', image: 'assets/pokemon/vulpix.png' },
  { name: 'Mewtwo', image: 'assets/pokemon/mewtwo.png' },
  { name: 'Mew', image: 'assets/pokemon/mew.png' },
  { name: 'Clefairy', image: 'assets/pokemon/clefairy.png' },
  { name: 'Pidgey', image: 'assets/pokemon/pidgey.png' },
  { name: 'Rattata', image: 'assets/pokemon/rattata.png' },
  { name: 'Sandshrew', image: 'assets/pokemon/sandshrew.png' },
  { name: 'Oddish', image: 'assets/pokemon/oddish.png' },
  { name: 'Diglett', image: 'assets/pokemon/diglett.png' },
  { name: 'Growlithe', image: 'assets/pokemon/growlithe.png' },
  { name: 'Abra', image: 'assets/pokemon/abra.png' },
  { name: 'Machop', image: 'assets/pokemon/machop.png' },
  { name: 'Ponyta', image: 'assets/pokemon/ponyta.png' },
  { name: 'Magikarp', image: 'assets/pokemon/magikarp.png' },
];

const LEVELS = [
  { name: 'Làm quen', rows: 9, cols: 16, types: 6, time: 600,
    mechanic: 'still', label: 'Đứng yên' },
  { name: 'Dồn phải', rows: 9, cols: 16, types: 8, time: 540,
    mechanic: 'right', label: 'Dồn sang phải' },
  { name: 'Rơi xuống', rows: 9, cols: 16, types: 12, time: 510,
    mechanic: 'down', label: 'Dồn xuống' },
  { name: 'Tách đôi', rows: 9, cols: 16, types: 16, time: 480,
    mechanic: 'split', label: 'Tách hai phía' },
  { name: 'Tường chữ thập', rows: 9, cols: 16, types: 16, time: 480,
    mechanic: 'cross', label: 'Có tường giữa' },
  { name: 'Băng chữ thập', rows: 9, cols: 16, types: 18, time: 450,
    mechanic: 'ice', label: 'Băng tan khi kề bên mất' },
  { name: 'Màn sương', rows: 9, cols: 16, types: 24, time: 420,
    mechanic: 'fog', label: 'Ghi nhớ hình Pokémon' }
];
const $ = id => document.getElementById(id);
let grid = [], level = 0, selected = null;
let active = false, paused = false, busy = false;
let seconds = 0, points = 0, lastTick = 0, session = 0;
let walls = new Set(), frozen = new Set(), revealed = new Set();

function cellKey(position) {
  return `${position.r},${position.c}`;
}

function sameCell(first, second) {
  return first.r === second.r && first.c === second.c;
}

function shuffled(values) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }

  return result;
}

function findPath(board, start, goal, blocked = new Set()) {
  if (sameCell(start, goal)) {
    return null;
  }

  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 }
  ];

  const startKey = `${start.r},${start.c},-1,0`;
  const queue = [{ ...start, direction: -1, turns: 0, key: startKey }];
  const parents = new Map([[startKey, null]]);
  const states = new Map([[startKey, queue[0]]]);
  let head = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    if (sameCell(current, goal)) {
      const path = [];
      let key = current.key;

      while (key !== null) {
        const state = states.get(key);
        path.push({ r: state.r, c: state.c });
        key = parents.get(key);
      }

      return path.reverse();
    }

    directions.forEach((direction, directionIndex) => {
      const changedDirection = current.direction !== -1 && current.direction !== directionIndex;
      const turns = current.turns + (changedDirection ? 1 : 0);

      if (turns > 2) {
        return;
      }

      const next = {
        r: current.r + direction.dr,
        c: current.c + direction.dc
      };

      if (next.r < 0 || next.r >= board.length || next.c < 0 || next.c >= board[0].length) {
        return;
      }

      const nextKey = cellKey(next);
      const isGoal = sameCell(next, goal);

      if (blocked.has(nextKey) || (!isGoal && board[next.r][next.c] !== null)) {
        return;
      }

      const stateKey = `${next.r},${next.c},${directionIndex},${turns}`;

      if (parents.has(stateKey)) {
        return;
      }

      const nextState = { ...next, direction: directionIndex, turns, key: stateKey };
      parents.set(stateKey, current.key);
      states.set(stateKey, nextState);
      queue.push(nextState);
    });
  }

  return null;
}

function getTilePositions(board = grid, blocked = walls) {
  const positions = [];

  for (let row = 1; row < board.length - 1; row += 1) {
    for (let col = 1; col < board[0].length - 1; col += 1) {
      const position = { r: row, c: col };

      if (board[row][col] !== null && !blocked.has(cellKey(position))) {
        positions.push(position);
      }
    }
  }

  return positions;
}

function findMoves(board = grid, blocked = walls, frozenCells = frozen, firstOnly = false) {
  const groups = new Map();
  const moves = [];

  getTilePositions(board, blocked).forEach((position) => {
    if (frozenCells.has(cellKey(position))) {
      return;
    }

    const pokemonId = board[position.r][position.c];

    if (!groups.has(pokemonId)) {
      groups.set(pokemonId, []);
    }

    groups.get(pokemonId).push(position);
  });

  for (const group of groups.values()) {
    for (let firstIndex = 0; firstIndex < group.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < group.length; secondIndex += 1) {
        const first = group[firstIndex];
        const second = group[secondIndex];
        const path = findPath(board, first, second, blocked);

        if (path) {
          moves.push({ a: first, b: second, path });

          if (firstOnly) {
            return moves;
          }
        }
      }
    }
  }

  return moves;
}

function showScreen(name) {
  ['home', 'levels', 'game'].forEach((screenId) => {
    $(screenId).hidden = screenId !== name;
  });

  window.scrollTo(0, 0);
}

function clearPath() {
  $('path').replaceChildren();
}

function tileAt(position) {
  return document.querySelector(`.tile[data-r="${position.r}"][data-c="${position.c}"]`);
}

function drawPath(path) {
  clearPath();

  const frame = document.querySelector('.board-frame').getBoundingClientRect();
  const first = tileAt({ r: 1, c: 1 }).getBoundingClientRect();
  const nextColumn = tileAt({ r: 1, c: 2 }).getBoundingClientRect();
  const nextRow = tileAt({ r: 2, c: 1 }).getBoundingClientRect();
  const stepX = nextColumn.left - first.left;
  const stepY = nextRow.top - first.top;

  const points = path.map((position) => {
    const x = first.left - frame.left - document.querySelector('.board-frame').clientLeft + first.width / 2 + (position.c - 1) * stepX;
    const y = first.top - frame.top - document.querySelector('.board-frame').clientTop + first.height / 2 + (position.r - 1) * stepY;
    return `${x},${y}`;
  }).join(' ');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  line.setAttribute('points', points);
  $('path').append(line);
}

function deselect() {
  document.querySelectorAll('.selected').forEach((element) => {
    element.classList.remove('selected');
    element.setAttribute('aria-pressed', 'false');
  });

  selected = null;
}

function start(index) {
  if (!Number.isInteger(index) || !LEVELS[index]) return;
  session += 1;
  level = index;
  active = false;
  paused = false;
  busy = false;
  selected = null;
  revealed = new Set();
  clearPath();

  if ($('modal').open) {
    $('modal').close();
  }

  const newBoard = buildBoard(LEVELS[level]);
  grid = newBoard.board;
  walls = newBoard.blocked;
  frozen = newBoard.frozenCells;
  seconds = LEVELS[level].time;
  points = 0;

  active = true;
  lastTick = performance.now();

  $('level-number').textContent = `MÀN ${level + 1}/${LEVELS.length}`;
  const movement = $('movement');
  if (movement) {
    movement.textContent = LEVELS[level].label;
  }
  showScreen('game');
  render();

  if (!findMoves(grid, walls, frozen, true).length) {
    reshuffle();
    render();
  }
}

function selectNormalTile(position) {
  if (selected && sameCell(selected, position)) {
    deselect();
    return;
  }

  if (!selected) {
    selected = position;
    tileAt(position).classList.add('selected');
    tileAt(position).setAttribute('aria-pressed', 'true');
    return;
  }

  const first = selected;
  const samePokemon = grid[first.r][first.c] === grid[position.r][position.c];
  const path = samePokemon ? findPath(grid, first, position, walls) : null;

  if (path) {
    completeMatch(first, position, path);
    return;
  }



  deselect();
  selected = position;
  tileAt(position).classList.add('selected', 'wrong');
  tileAt(position).setAttribute('aria-pressed', 'true');
  say(samePokemon ? 'Hai ô giống nhau nhưng đường đang bị chặn.' : 'Hai ô này chưa giống nhau.');

  const thisSession = session;
  window.setTimeout(() => {
    if (thisSession !== session) return;
    const element = tileAt(position);

    if (element) {
      element.classList.remove('wrong');
    }
  }, 420);
}

function forceConnectablePair(positions, originalValues) {
  const pairPositions = positions.filter((position) => !frozen.has(cellKey(position)));

  const counts = new Map();

  originalValues.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const repeatedPokemon = [...counts.entries()].find(([, count]) => count >= 2);

  if (!repeatedPokemon) {
    return false;
  }

  const pokemonId = repeatedPokemon[0];

  for (let firstIndex = 0; firstIndex < pairPositions.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < pairPositions.length; secondIndex += 1) {
      const first = pairPositions[firstIndex];
      const second = pairPositions[secondIndex];
      const firstValueIndex = positions.findIndex((position) => sameCell(position, first));
      const secondValueIndex = positions.findIndex((position) => sameCell(position, second));

      if (!findPath(grid, first, second, walls)) {
        continue;
      }

      const arrangedValues = [...originalValues];
      const firstSource = arrangedValues.findIndex((value) => value === pokemonId);

      if (firstSource !== firstValueIndex) {
        [arrangedValues[firstValueIndex], arrangedValues[firstSource]] = [
          arrangedValues[firstSource],
          arrangedValues[firstValueIndex]
        ];
      }

      const secondSource = arrangedValues.findIndex(
        (value, index) => index !== firstValueIndex && value === pokemonId
      );

      if (arrangedValues[secondValueIndex] !== pokemonId) {
        [arrangedValues[secondValueIndex], arrangedValues[secondSource]] = [
          arrangedValues[secondSource],
          arrangedValues[secondValueIndex]
        ];
      }

      positions.forEach((position, index) => {
        grid[position.r][position.c] = arrangedValues[index];
      });

      return findMoves(grid, walls, frozen, true).length > 0;
    }
  }

  return false;
}

function reshuffle() {
  deselect();
  revealed.clear();
  const positions = getTilePositions();
  const originalValues = positions.map((position) => grid[position.r][position.c]);

  for (let attempt = 0; attempt < 60; attempt += 1) {
    const bag = shuffled(originalValues);

    positions.forEach((position, index) => {
      grid[position.r][position.c] = bag[index];
    });

    if (findMoves(grid, walls, frozen, true).length > 0) {
      return true;
    }
  }

  const forcedMove = forceConnectablePair(positions, originalValues);

  if (forcedMove) {
    return true;
  }

  positions.forEach((position, index) => {
    grid[position.r][position.c] = originalValues[index];
  });

  return false;
}

function ensureModal() {
  let modal = $('modal');

  if (modal) {
    return modal;
  }

  modal = document.createElement('dialog');
  modal.id = 'modal';
  modal.innerHTML = '<div id="modal-icon" aria-hidden="true">Ⅱ</div><h2 id="modal-title"></h2><p id="modal-description"></p><div id="modal-actions"></div>';
  document.body.append(modal);

  return modal;
}

function openModal(icon, title, description, actions) {
  const modal = ensureModal();

  $('modal-icon').textContent = icon;
  $('modal-title').textContent = title;
  $('modal-description').textContent = description;
  $('modal-actions').replaceChildren();

  actions.forEach(([label, action, primary]) => {
    const button = document.createElement('button');
    button.className = primary ? 'primary' : 'secondary';
    button.textContent = label;
    button.addEventListener('click', action);
    $('modal-actions').append(button);
  });

  if (!modal.open) {
    modal.showModal();
  }
}

function resume() {
  if (!active) {
    return;
  }

  paused = false;
  lastTick = performance.now();
  $('modal').close();
}

function pause() {
  if (!active || paused) {
    return;
  }

  paused = true;
  openModal('Ⅱ', 'Tạm dừng', 'Đồng hồ đã dừng. Nhấn tiếp tục để chơi.', [
    ['Tiếp tục chơi', resume, true],
    ['Chơi lại màn này', () => start(level)],
    ['Về trang chủ', home]
  ]);
}

function home() {
  session += 1;
  active = false;
  paused = false;
  busy = false;

  if ($('modal').open) {
    $('modal').close();
  }

  clearPath();
  showScreen('home');
}

function finish(won) {
  active = false;
  busy = false;
  clearPath();
  updateStats();

  const actions = [];
  const finalLevel = level === LEVELS.length - 1;

  if (won && !finalLevel) {
    actions.push(['Chơi màn tiếp theo', () => start(level + 1), true]);
  } else {
    actions.push(['Chơi lại', () => start(level), true]);
  }

  actions.push(['Chọn màn chơi', () => {
    home();
    showScreen('levels');
  }]);
  actions.push(['Về trang chủ', home]);

  const title = won ? (finalLevel ? 'Bạn là bậc thầy!' : 'Hoàn thành màn chơi!') : 'Hết thời gian';
  const description = won
    ? `${points} điểm · Còn ${Math.ceil(seconds)} giây. ${finalLevel ? `Bạn đã chinh phục cả ${LEVELS.length} màn.` : 'Sẵn sàng cho thử thách tiếp theo?'} `
    : `Bạn đã nối ${points / 100} cặp. Thử lại để tìm các cặp nhanh hơn nhé!`;

  openModal(won ? '🏆' : '⌛', title, description, actions);
}

function askToExit() {
  if (!active) {
    home();
    return;
  }

  paused = true;
  openModal('↩', 'Rời màn chơi?', 'Tiến độ lượt chơi này sẽ mất khi về trang chủ.', [
    ['Tiếp tục chơi', resume, true],
    ['Về trang chủ', home]
  ]);
}

function renderLevelCards() {
  let levelGrid = $('level-grid');

  if (!levelGrid) {
    levelGrid = document.createElement('div');
    levelGrid.id = 'level-grid';
    levelGrid.className = 'level-grid';
    $('levels').append(levelGrid);
  }

  levelGrid.replaceChildren();

  LEVELS.forEach((config, index) => {
    const card = document.createElement('button');

    card.type = 'button';
    card.className = 'level-card';
    card.innerHTML = `
      <span class="number">MÀN ${String(index + 1).padStart(2, '0')}</span>
      <span class="level-icon" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <h3>${config.name}</h3>
      <p>${config.cols} cột × ${config.rows} hàng · ${config.types} loại Pokémon · ${config.time}s<br>
      ${config.label}</p>
    `;

    card.addEventListener('click', () => start(index));
    levelGrid.append(card);
  });
}

function connectControls() {
  $('play').addEventListener('click', () => start(0));
  $('choose').addEventListener('click', () => showScreen('levels'));
  document.querySelectorAll('.back-home').forEach((button) => {
    button.addEventListener('click', home);
  });

  $('exit').addEventListener('click', askToExit);
  $('pause').addEventListener('click', pause);
}

function connectWindowEvents() {
  $('modal').addEventListener('cancel', (event) => {
    event.preventDefault();

    if (active) {
      resume();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('modal').open) {
      pause();
    }
  });

  window.addEventListener('resize', clearPath);
}

function tickClock() {
  const now = performance.now();

  if (active && !paused) {
    seconds = Math.max(0, seconds - (now - lastTick) / 1000);
    updateStats();

    if (seconds <= 0) {
      finish(false);
    }
  }

  lastTick = now;
}

function initializeGame() {
  $('pause').className = $('exit').className;
  const remaining = $('remaining');
  if (remaining) remaining.parentElement.remove();
  ensureModal();
  renderLevelCards();
  connectControls();
  connectWindowEvents();
  window.setInterval(tickClock, 200);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame, { once: true });
} else {
  initializeGame();
}

