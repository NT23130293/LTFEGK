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









