const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(require('node:path').join(__dirname, '../script.js'), 'utf8');
// Kiểm tra logic độc lập với trình duyệt, bỏ đoạn khởi tạo giao diện.
const context = vm.createContext({ console, Set, Map });
vm.runInContext(code.slice(0, code.lastIndexOf('\nfunction initializeGame()')), context);
vm.runInContext(`
  function check(value, message) { if (!value) throw Error(message); }
  const empty = (r, c) => Array.from({length:r+2}, () => Array(c+2).fill(null));
  let b = empty(3,3);
  b[1][1]=0; b[1][3]=0;
  check(findPath(b,{r:1,c:1},{r:1,c:3}), 'Đường thẳng');
  check(!findPath(b,{r:1,c:1},{r:1,c:1}), 'Không nối cùng ô');
  b[1][2]=1;
  const outside = findPath(b,{r:1,c:1},{r:1,c:3});
  check(outside && outside.some(p=>p.r===0), 'Nối vòng ngoài với hai lần rẽ');
  b=empty(3,3); b[1][1]=0; b[2][2]=0;
  check(findPath(b,{r:1,c:1},{r:2,c:2}), 'Một lần rẽ');
  b=empty(5,5);
  for(let r=1;r<=5;r++) for(let c=1;c<=5;c++) b[r][c]=1;
  b[3][3]=0; b[1][1]=0;
  check(!findPath(b,{r:3,c:3},{r:1,c:1}), 'Ô bị bao kín');
  // Hành lang chỉ đi được với ba lần rẽ phải bị từ chối.
  b=Array.from({length:7},()=>Array(7).fill(9));
  [{r:2,c:1},{r:2,c:2},{r:3,c:2},{r:4,c:2},{r:4,c:3}].forEach(p=>b[p.r][p.c]=null);
  b[1][1]=0; b[4][4]=0;
  check(!findPath(b,{r:1,c:1},{r:4,c:4}), 'Từ chối quá hai lần rẽ');
  level=1; grid=empty(9,16); grid[1][1]=0;grid[1][3]=1;grid[1][6]=2;
  applyMovement();
  check(grid[1][14]===0 && grid[1][15]===1 && grid[1][16]===2, 'Dồn phải ổn định');
  level=0; const before=JSON.stringify(grid);applyMovement();
  check(JSON.stringify(grid)===before,'Màn 1 đứng yên');
  // Kiểm tra trực tiếp phương án dự phòng sau khi xáo ngẫu nhiên thất bại.
  grid=empty(3,4);grid[1][1]=0;grid[1][2]=1;grid[1][3]=0;grid[1][4]=1;
  const positions=getTilePositions(), original=positions.map(p=>grid[p.r][p.c]);
  check(forceConnectablePair(positions,original),'Ép một cặp nối được');
  check(getTilePositions().map(p=>grid[p.r][p.c]).sort().join(',')===original.sort().join(','),'Dự phòng giữ quân');
  // Chơi tự động nhiều bàn đến hết: kiểm tra cặp chẵn, xáo và dồn quân.
  for(level=0;level<LEVELS.length;level++) {
    for(let trial=0;trial<8;trial++) {
      grid=buildBoard(LEVELS[level]).board;
      check(getTilePositions().length===144,'Đủ 144 ô');
      const counts=new Map();getTilePositions().forEach(p=>counts.set(grid[p.r][p.c],(counts.get(grid[p.r][p.c])||0)+1));
      check([...counts.values()].every(n=>n%2===0),'Mỗi loại có số quân chẵn');
      for(let pair=0;pair<72;pair++) {
        let move=findMoves(grid,walls,frozen,true)[0];
        if(!move) {
          deselect=()=>{};
          const values=getTilePositions().map(p=>grid[p.r][p.c]).sort().join(',');
          check(reshuffle(),'Xáo có nước đi');
          check(getTilePositions().map(p=>grid[p.r][p.c]).sort().join(',')===values,'Xáo giữ số lượng quân');
          move=findMoves(grid,walls,frozen,true)[0];
        }
        check(grid[move.a.r][move.a.c]===grid[move.b.r][move.b.c],'Cặp cùng loại');
        grid[move.a.r][move.a.c]=null;grid[move.b.r][move.b.c]=null;
        applyMovement();
      }
      check(getTilePositions().length===0,'Hoàn thành màn');
    }
  }
`, context);
assert.equal(vm.runInContext('LEVELS.length', context), 2);
console.log('PASS: đường nối, luật hai màn, bảo toàn quân khi xáo; hoàn thành 16 bàn (1.152 cặp).');
