const POKEMON = [
    { name: 'Pikachu', image: 'assets/pokemon/pikachu.png' },
    { name: 'Bulbasaur', image: 'assets/pokemon/bulbasaur.png' },
    { name: 'Charmander', image: 'assets/pokemon/charmander.png' },
    { name: 'Squirtle', image: 'assets/pokemon/squirtle.png' },
    { name: 'Jigglypuff', image: 'assets/pokemon/jigglypuff.png' },
    { name: 'Meowth', image: 'assets/pokemon/meowth.png' },
    { name: 'Psyduck', image: 'assets/pokemon/psyduck.png' },
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
    { name: 'Magikarp', image: 'assets/pokemon/magikarp.png' }
];
const LEVELS = [
    {
        name: 'cổ điển', rows: 9, cols: 16, types: 6, time: 600,
        mechanic: 'still', label: 'Đứng yên'
    },
    {
        name: 'Dồn phải', rows: 9, cols: 16, types: 8, time: 540,
        mechanic: 'right', label: 'Dồn sang phải ',
        help: 'Sau mỗi cặp, Pokémon trong từng hàng dồn về mép phải.'
    }
    ];
const $ = (id) => document.getElementById(id);
let grid = [];
let level = 0;
let selected = null;
let active = false;
let paused = false;
let busy = false;
let seconds = 0;
let points = 0;
function cellKey(position) {

    return `${position.r},${position.c}`;
}
function sameCell(first, second) {
    return first.r === second.r && first.c === second.c;

}
// trộn màn fisher-yates
function shuffled(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const otherIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
    }

    return result;
}
// thuật toán bfs
function findPath(board, start, goal, blocked = new Set()) {
    if (sameCell(start, goal)) {
        return null;
    }
    const directions = [
        {dr: -1, dc: 0},
        {dr: 0, dc: 1},
        {dr: 1, dc: 0},
        {dr: 0, dc: -1}
    ];
    const startKey = `${start.r},${start.c},-1,0`;
    const queue = [{...start, direction: -1, turns: 0, key: startKey}];
    const parents = new Map([[startKey, null]]);
    const states = new Map([[startKey, queue[0]]]);
    let head = 0;
    while (head < queue.length) {
        const current = queue[head];
        head += 1;
        if (sameCell(current, goal)) {
            const path = [];
            while (key !== null) {
                const state = states.get(key);
                path.push({r: state.r, c: state.c});
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
            const nextState = {...next, direction: directionIndex, turns, key: stateKey};
            parents.set(stateKey, current.key);
            states.set(stateKey, nextState);
            queue.push(nextState);
        });
    }
    return null;
}
// các ô còn pokemon
function getTilePositions(board = grid){
    const positions = [];
    for (let row = 1; row < board.length - 1; row += 1) {
        for (let col = 1; col < board[0].length - 1; col += 1) {
            const position = {r: row, c: col};
            if (board[row][col] !== null && !blocked.has(cellKey(position))) {
                positions.push(position);
            }
        }
    }
    return positions;


    }
    // các cặp có thể nối
function findMoves(board = grid,  firstOnly = false) {
    const groups = new Map();
    const moves = [];
    getTilePositions(board).forEach((position) => {
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
                    moves.push({a: first, b: second, path});
                    if (firstOnly) {

                        return moves;
                    }


                }


            }
        }
    }
    return moves;

}
// xáo bài
function buildBoard(config) {
    const blocked = createWalls(config);
    const positions = [];
    for (let row = 1; row <= config.rows; row += 1) {
        for (let col = 1; col <= config.cols; col += 1) {
            if (!blocked.has(cellKey({r: row, c: col}))) {
                positions.push({r: row, c: col});

            }

        }
    }
    const pokemonBag = [];
    for (let pairIndex = 0; pairIndex < positions.length / 2; pairIndex += 1) {
        const pokemonId = pairIndex % config.types;
        pokemonBag.push(pokemonId, pokemonId);
    }
    let lastBoard = null;
    for (let attempt = 0; attempt < 24; attempt += 1) {
        const board = Array.from({length: config.rows + 2}, () => Array(config.cols + 2).fill(null));
        const bag = shuffled(pokemonBag);
        positions.forEach((position, index) => {
            board[position.r][position.c] = bag[index];

        });


    }
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
        const x = first.left - frame.left + first.width / 2 + (position.c - 1) * stepX;
        const y = first.top - frame.top + first.height / 2 + (position.r - 1) * stepY;
        return `${x},${y}`;

    }).join('');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('points', points);
    $('path').append(line);


}
// đồng hô
function updateStats() {
    const wholeSeconds = Math.max(0, Math.ceil(seconds));
    const minutes = String(Math.floor(wholeSeconds / 60)).padStart(2, '0');
    const remainder = String(wholeSeconds % 60).padStart(2, '0');
    const totalPairs = getTilePositions().length / 2;

    $('timer').textContent = `${minutes}:${remainder}`;
    const remaining = $('remaining');
    if (remaining) {
        remaining.innerHTML = `${totalPairs} <small>cặp</small>`;
    }
    $('score').textContent = points;
    if (LEVELS[level].mechanic === 'combo') {
        const movement = $('movement');
        if (movement) {
            movement.textContent = `Chuỗi ${comboStreak}/5`;
        }
    }




    }
function  say(message){
    const messageElement = $('message');
if( messageElement){
    messageElement.textContent = message;
}
}
function render() {
    const config = LEVELS[level];
    const boardElement = $('board');
    boardElement.style.setProperty('--cols', config.cols);
    boardElement.replaceChildren();
    for (let row = 1; row <= config.rows; row += 1) {
        for (let col = 1; col <= config.cols; col += 1) {
            const position = { r: row, c: col };
            const key = cellKey(position);
            const value = grid[row][col];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tile';
            button.dataset.r = row;
            button.dataset.c = col;
            button.setAttribute('aria-pressed', String(Boolean(selected && sameCell(selected, position))));
            button.addEventListener('click', () => selectTile(position));
            boardElement.append(button);

        }
    }
    updateStats();
}
function deselect() {
    document.querySelectorAll('.selected').forEach((element) => {
        element.classList.remove('selected');
        element.setAttribute('aria-pressed', 'false');
    });
    selected = null
    }
function start(index) {
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
    say('Chọn hai ô giống nhau để nối.');
    if (!findMoves(grid, walls, frozen, true).length) {
        reshuffle();
        render();

    }
}
function compactLine(positions, alignment) {
    const values = positions.map((position)=> grid[position.r][position.c]).filter((value) => value !== null);
    positions.forEach((position) => {
        grid[position.r][position.c] = null;
    });
    let offset = 0;
    if (alignment === 'end') {
        offset = positions.length - values.length;
    } else if (alignment === 'center') {
        offset = Math.floor((positions.length - values.length) / 2);

    }
    values.forEach((value, index) => {
        const position = positions[index + offset];
        grid[position.r][position.c] = value;

    });



    }
// Dồn từng góc phần tư về góc ngoài
function compactIntoCorners(config) {
    const middleRow = Math.floor(config.rows / 2);
    const middleCol = Math.floor(config.cols / 2);
    const quadrants = [
        {top: 1, bottom: middleRow, left: 1, right: middleCol, horizontal: 'start', vertical: 'start'},
        {top: 1, bottom: middleRow, left: middleCol + 1, right: config.cols, horizontal: 'end', vertical: 'start'},
        {top: middleRow + 1, bottom: config.rows, left: 1, right: middleCol, horizontal: 'start', vertical: 'end'},
        {
            top: middleRow + 1,
            bottom: config.rows,
            left: middleCol + 1,
            right: config.cols,
            horizontal: 'end',
            vertical: 'end'
        }
    ];
    quadrants.forEach((quadrant) => {
        for (let row = quadrant.top; row <= quadrant.bottom; row += 1) {
            const rowCells = [];
            for (let col = quadrant.left; col <= quadrant.right; col += 1) {
                rowCells.push({r: row, c: col});

            }
            compactLine(rowCells, quadrant.horizontal);
        }
        for (let col = quadrant.left; col <= quadrant.right; col += 1) {
            const columnCells = [];
            for (let row = quadrant.top; row <= quadrant.bottom; row += 1) {
                columnCells.push({r: row, c: col});
            }
            compactLine(columnCells, quadrant.vertical);
        }
    });
}
// xoay ô
function rotateOuterRing(config) {
    const ring = [];
    for (let col = 1; col <= config.cols; col += 1) {
        ring.push({r: 1, c: col});
    }
    for (let row = 2; row <= config.rows; row += 1) {
        ring.push({r: row, c: config.cols});

    }
    for (let col = config.cols - 1; col >= 1; col -= 1) {
        ring.push({r: config.rows, c: col});
    }
    for (let row = config.rows - 1; row >= 2; row -= 1) {
        ring.push({r: row, c: 1});
    }
    const values = ring.map((position) => grid[position.r][position.c]);
    ring.forEach((position, index) => {
        const nextIndex = (index + 1) % ring.length;
        grid[ring[nextIndex].r][ring[nextIndex].c] = values[index];
    });
}

function moveConveyorColumns(config) {
    for (let col = 2; col <= config.cols; col += 2) {
        const lastValue = grid[config.rows][col];
        for (let row = config.rows; row > 1; row -= 1) {
            grid[row][col] = grid[row - 1][col];
        }
        grid[1][col] = lastValue;


    }
}
function reverseClearedRows(clearedPositions, config) {
    const affectedRows = new Set(clearedPositions.map((position) => position.r));
    affectedRows.forEach((row) => {
        const values = [];
        for (let col = 1; col <= config.cols; col += 1) {
            values.push(grid[row][col]);
        }
        values.reverse().forEach((value, index) => {
            grid[row][index + 1] = value;
        });
    });




        }
function applyMovement(clearedPositions) {
    const config = LEVELS[level];
    if (config.mechanic === 'right') {
        for (let row = 1; row <= config.rows; row += 1) {
            const positions = Array.from(
                {length: config.cols}, (_, index) => ({r: row, c: index + 1}));
            compactLine(positions, 'end');

        }


    }
    if (config.mechanic === 'down') {
        for (let col = 1; col <= config.cols; col += 1) {
            const positions = Array.from({length: config.rows}, (_, index) => ({r: index + 1, c: col}));
            compactLine(positions, 'end')
        }


    }
    if (config.mechanic === 'split') {

        for (let row = 1; row <= config.rows; row += 1) {
            const positions = Array.from({length: config.cols}, (_, index) => ({r: row, c: index + 1}));
            const center = Math.floor(positions.length / 2);
            compactLine(positions.slice(0, center), 'start');
            compactLine(positions.slice(center), 'end');


        }
    }
    if (config.mechanic === 'corners') {
        compactIntoCorners(config);

    }
    if (config.mechanic === 'ring') {
        rotateOuterRing(config);
    }
    if (config.mechanic === 'conveyor') {
        moveConveyorColumns(config);
    }
    if (config.mechanic === 'flipRows') {
        reverseClearedRows(clearedPositions, config);
    }
}






























