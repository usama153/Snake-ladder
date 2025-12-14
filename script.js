// ===== Game State =====
let players = [];
let currentTurn = 0;
let gameOver = false;

// ===== Graph for Snakes & Ladders =====
const graph = new Map([
  [3, 22], [5, 8], [11, 26], [20, 29], // ladders
  [27, 1], [21, 9], [17, 4], [19, 7], [99, 78] // snakes
]);

// ===== INIT GAME =====
window.onload = function() {
  players = [];

  // Get number of players from Lobby
  const count = parseInt(localStorage.getItem("playerCount")) || 1;

  // Get main logged-in user
  const mainUser = localStorage.getItem("loggedInUser") || `Player 1`;
  players.push({name: mainUser, position:1, moves:0});

  // Add remaining players if count > 1
  for(let i=2;i<=count;i++){
    const name = prompt(`Enter Player ${i} Name:`) || `Player ${i}`;
    players.push({name, position:1, moves:0});
  }

  drawBoard();
  updateScore();
  showTurn();
  // default overlay: show true (for clarity), and load history when page starts
  window.enableOverlay = true;
  // overlayMode: 'icons' (minimized), 'simple' (dashed lines), 'full' (detailed)
  window.overlayMode = 'icons';
  if(document.getElementById('history')) fetchHistory();
};


// ===== Board Rendering =====
function drawBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for(let i=100;i>=1;i--){
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.id = `cell-${i}`;
    cell.innerText = i;
    board.appendChild(cell);
  }
  renderTokens();
  if(window.enableOverlay !== false) renderSnakesLadders();
}

// ===== Render Snakes & Ladders (SVG overlay) =====
function renderSnakesLadders(){
  const board = document.getElementById('board');
  // remove existing svg and images
  const old = document.getElementById('s-l-svg');
  if(old) old.remove();
  document.querySelectorAll('#board .s-img').forEach(e=>e.remove());

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('id','s-l-svg');
  svg.setAttribute('width', board.clientWidth);
  svg.setAttribute('height', board.clientHeight);
  svg.setAttribute('viewBox', `0 0 ${board.clientWidth} ${board.clientHeight}`);
  board.appendChild(svg);

  // defs: marker for snake head (triangle)
  const defs = document.createElementNS(svgNS,'defs');
  const marker = document.createElementNS(svgNS,'marker');
  marker.setAttribute('id','arrow');
  marker.setAttribute('markerWidth','10');
  marker.setAttribute('markerHeight','10');
  marker.setAttribute('refX','5');
  marker.setAttribute('refY','5');
  marker.setAttribute('orient','auto');
  const arrowPath = document.createElementNS(svgNS,'path');
  arrowPath.setAttribute('d','M0,0 L10,5 L0,10 z');
  arrowPath.setAttribute('fill','#b22222');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // adjust overlay classes for simplified modes
  if(window.overlayMode === 'icons'){
    svg.classList.add('icons-only');
  } else {
    svg.classList.remove('icons-only');
  }

  const boardRect = board.getBoundingClientRect();

  function cellCenter(n){
    const el = document.getElementById(`cell-${n}`);
    if(!el) return {x:0,y:0};
    const r = el.getBoundingClientRect();
    return { x: r.left - boardRect.left + r.width/2, y: r.top - boardRect.top + r.height/2 };
  }

  // iterate graph entries
  for(const [from,to] of graph){
    const a = cellCenter(from);
    const b = cellCenter(to);
    if(!a || !b) continue;

    if(to>from){
      // Ladder: draw two rails and rungs
      const offset = 8;
      // left rail - full mode only
      let leftPath = null;
      if(window.overlayMode === 'full'){
        leftPath = document.createElementNS(svgNS,'line');
        leftPath.setAttribute('x1', a.x - offset);
        leftPath.setAttribute('y1', a.y + offset);
        leftPath.setAttribute('x2', b.x - offset);
        leftPath.setAttribute('y2', b.y - offset);
        leftPath.setAttribute('class','ladder-line');
        leftPath.setAttribute('data-from', from);
        leftPath.setAttribute('data-to', to);
        svg.appendChild(leftPath);
      }
      // right rail - full mode only
      let rightPath = null;
      if(window.overlayMode === 'full'){
        rightPath = document.createElementNS(svgNS,'line');
        rightPath.setAttribute('x1', a.x + offset);
        rightPath.setAttribute('y1', a.y - offset);
        rightPath.setAttribute('x2', b.x + offset);
        rightPath.setAttribute('y2', b.y + offset);
        rightPath.setAttribute('class','ladder-line');
        rightPath.setAttribute('data-from', from);
        rightPath.setAttribute('data-to', to);
        svg.appendChild(rightPath);
      }
      // rungs - full mode only
      if(window.overlayMode === 'full'){
        const rungCount = 4;
        for(let i=1;i<=rungCount;i++){
        const t = i/(rungCount+1);
        const rx = a.x + (b.x-a.x)*t;
        const ry = a.y + (b.y-a.y)*t;
        const rlx = rx - offset*0.8;
        const rrx = rx + offset*0.8;
        const rung = document.createElementNS(svgNS,'line');
        rung.setAttribute('data-from', from);
        rung.setAttribute('data-to', to);
        rung.setAttribute('x1', rlx);
        rung.setAttribute('y1', ry);
        rung.setAttribute('x2', rrx);
        rung.setAttribute('y2', ry);
        rung.setAttribute('class','ladder-rung');
        svg.appendChild(rung);
        }
      }

      // decorative ladder image stretched between points
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy,dx) * 180 / Math.PI;
      // Ladder full rails + rungs drawn already; avoid stretching the large svg image
      // label start / end for the ladder (useful for all modes)
      const t1 = document.createElementNS(svgNS,'text');
      t1.setAttribute('x', a.x - 6);
      t1.setAttribute('y', a.y - 12);
      t1.setAttribute('font-size','10');
      t1.setAttribute('fill','#2e8b57');
      t1.setAttribute('style','paint-order: stroke; stroke: #ffffff; stroke-width: 2px;');
      t1.textContent = from;
      svg.appendChild(t1);
      const t2 = document.createElementNS(svgNS,'text');
      t2.setAttribute('x', b.x - 6);
      t2.setAttribute('y', b.y - 12);
      t2.setAttribute('font-size','10');
      t2.setAttribute('fill','#2e8b57');
      t2.setAttribute('style','paint-order: stroke; stroke: #ffffff; stroke-width: 2px;');
      t2.textContent = to;
      svg.appendChild(t2);
      // simple mode draws a single dashed line between centers
      if(window.overlayMode === 'simple'){
        const sline = document.createElementNS(svgNS,'line');
        sline.setAttribute('x1', a.x);
        sline.setAttribute('y1', a.y);
        sline.setAttribute('x2', b.x);
        sline.setAttribute('y2', b.y);
        sline.setAttribute('class', 'ladder-line simple-line');
        sline.setAttribute('data-from', from);
        sline.setAttribute('data-to', to);
        svg.appendChild(sline);
        attachOverlayEvents(sline, from, to, true);
      }
      // (no full-sized svg image appended to avoid clutter)
          // small ladder icon at midpoint (always show in icons/simple/full)
      const icon = document.createElementNS(svgNS,'image');
      icon.setAttribute('href','assets/ladder-icon.svg');
      const iconSize = 36;
      const icx = a.x + dx/2 - iconSize/2;
      const icy = a.y + dy/2 - iconSize/2;
      const centerX = a.x + dx/2;
      const centerY = a.y + dy/2;
      icon.setAttribute('x', icx);
      icon.setAttribute('y', icy);
      icon.setAttribute('width', iconSize);
      icon.setAttribute('height', iconSize);
      icon.setAttribute('preserveAspectRatio','xMidYMid meet');
      icon.setAttribute('transform', `rotate(${angle} ${centerX} ${centerY})`);
      icon.setAttribute('opacity','0.95');
      icon.setAttribute('title', `${from} -> ${to}`);
      svg.appendChild(icon);
      // attach events to the central icon for hover
      attachOverlayEvents(icon, from, to, true);
      if(window.overlayMode === 'full'){
        // attach to rails if they exist
        svg.querySelectorAll(`line[data-from='${from}'][data-to='${to}']`).forEach(r => attachOverlayEvents(r, from, to, true));
      }
      // rungs also highlight
      svg.querySelectorAll(`line[data-from='${from}'][data-to='${to}']`).forEach(r => attachOverlayEvents(r, from, to, true));

    } else {
      // Snake: draw a curved path between points
      const dx = (b.x - a.x);
      const dy = (b.y - a.y);
      const mx = (a.x + b.x)/2;
      const my = (a.y + b.y)/2;
      // control points for wavy curve
      const cp1x = mx + dy*0.12;
      const cp1y = my - dx*0.08;
      const cp2x = mx - dy*0.12;
      const cp2y = my + dx*0.08;
      let path = null;
      if(window.overlayMode === 'simple'){
        // simple straight dashed line between centers
        path = document.createElementNS(svgNS,'line');
        path.setAttribute('x1', a.x);
        path.setAttribute('y1', a.y);
        path.setAttribute('x2', b.x);
        path.setAttribute('y2', b.y);
      } else {
        path = document.createElementNS(svgNS,'path');
        const d = `M ${a.x} ${a.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${b.x} ${b.y}`;
        path.setAttribute('d', d);
      }
      // class assignment based on mode
      if(window.overlayMode === 'icons'){
        // icons mode: no path
      } else if(window.overlayMode === 'simple'){
        path.setAttribute('class','snake-path simple-line');
      } else {
        path.setAttribute('class','snake-path');
      }
      if(window.overlayMode !== 'icons') path.setAttribute('marker-end', 'url(#arrow)');
      path.setAttribute('title', `${from} -> ${to}`);
      path.setAttribute('data-from', from);
      path.setAttribute('data-to', to);
      if(window.overlayMode !== 'icons') svg.appendChild(path);
      attachOverlayEvents(path, from, to, false);

      // label snake start / end
      const st1 = document.createElementNS(svgNS,'text');
      st1.setAttribute('x', a.x - 6);
      st1.setAttribute('y', a.y - 12);
      st1.setAttribute('font-size','10');
      st1.setAttribute('fill','#b22222');
      st1.setAttribute('style','paint-order: stroke; stroke: #ffffff; stroke-width: 2px;');
      st1.textContent = from;
      svg.appendChild(st1);
      const st2 = document.createElementNS(svgNS,'text');
      st2.setAttribute('x', b.x - 6);
      st2.setAttribute('y', b.y - 12);
      st2.setAttribute('font-size','10');
      st2.setAttribute('fill','#b22222');
      st2.setAttribute('style','paint-order: stroke; stroke: #ffffff; stroke-width: 2px;');
      st2.textContent = to;
      svg.appendChild(st2);

      // small snake head icon (always show) — prefer at start so direction is clear
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy,dx) * 180 / Math.PI;
      // add a snake head image at the destination
      const headW = 20;
      const headH = 20;
      const head = document.createElementNS(svgNS,'image');
      head.setAttribute('href','assets/snake-head.svg');
      head.setAttribute('x', a.x - headW/2);
      head.setAttribute('y', a.y - headH/2);
      head.setAttribute('width', headW);
      head.setAttribute('height', headH);
      head.setAttribute('transform', `rotate(${angle} ${a.x} ${a.y})`);
      head.setAttribute('opacity', '0.95');
      head.setAttribute('title', `${from} -> ${to}`);
      head.setAttribute('preserveAspectRatio','xMidYMid meet');
      svg.appendChild(head);
      attachOverlayEvents(head, from, to, false);
      attachOverlayEvents(head, from, to, false);
      // add a small tail icon at the end to indicate where the snake drops
      const tail = document.createElementNS(svgNS,'circle');
      tail.setAttribute('cx', b.x);
      tail.setAttribute('cy', b.y);
      tail.setAttribute('r', 4);
      tail.setAttribute('fill', '#b22222');
      svg.appendChild(tail);
    }
  }
}

// attach hover events to overlay items
function attachOverlayEvents(el, from, to, isLadder){
  if(!el) return;
  el.addEventListener('mouseenter', (e)=>{
    try{ e.target.classList.add('overlay-hover'); }catch{};
    const startEl = document.getElementById(`cell-${from}`);
    const endEl = document.getElementById(`cell-${to}`);
    if(startEl) startEl.classList.add('highlight-start');
    if(endEl) endEl.classList.add('highlight-end');
    // show tooltip
    const tooltip = document.getElementById('overlayTooltip');
    if(tooltip){
      tooltip.style.display = 'block';
      tooltip.innerText = isLadder ? `${from} ⬆ ${to} (Ladder)` : `${from} ⬇ ${to} (Snake)`;
      const x = e.pageX + 10; const y = e.pageY + 10;
      tooltip.style.left = x + 'px'; tooltip.style.top = y + 'px';
    }
  });
  el.addEventListener('mousemove', (e)=>{
    const tooltip = document.getElementById('overlayTooltip');
    if(tooltip && tooltip.style.display === 'block'){
      tooltip.style.left = (e.pageX + 10) + 'px';
      tooltip.style.top = (e.pageY + 10) + 'px';
    }
  });
  el.addEventListener('mouseleave', (e)=>{
    try{ e.target.classList.remove('overlay-hover'); }catch{};
    const startEl = document.getElementById(`cell-${from}`);
    const endEl = document.getElementById(`cell-${to}`);
    if(startEl) startEl.classList.remove('highlight-start');
    if(endEl) endEl.classList.remove('highlight-end');
    const tooltip = document.getElementById('overlayTooltip');
    if(tooltip){ tooltip.style.display = 'none'; }
  });
}

// Re-render overlay on resize (keeps lines aligned)
window.addEventListener('resize', ()=>{
  const board = document.getElementById('board');
  if(board && window.enableOverlay !== false) renderSnakesLadders();
});

// ===== Render Tokens =====
function renderTokens() {
  document.querySelectorAll(".token").forEach(t=>t.remove());
  players.forEach((p,index)=>{
    const cell = document.getElementById(`cell-${p.position}`);
    const token = document.createElement("div");
    token.className = `token token${index+1}`;
    token.style.top = `${4 + index*16}px`;
    token.style.left = `${4 + index*16}px`;
    cell.appendChild(token);
  });
}

// ===== Roll Dice =====
function rollDice(){
  if(gameOver) return;

  const player = players[currentTurn];
  const dice = Math.floor(Math.random()*6)+1;
  let next = player.position + dice;
  let specialMove = "";

  if(next<=100){
    if(graph.has(next)){
      specialMove = graph.get(next) > next ? " (Ladder)" : " (Snake)";
      next = graph.get(next);
    }
    player.position = next;
  }

  player.moves++;
  document.getElementById("diceResult").innerText = `${player.name} rolled ${dice}${specialMove}`;
  renderTokens();
  updateScore();

  if(player.position===100){
    gameOver = true;
    alert(`🎉 ${player.name} wins the game!`);
    saveWin(player);
    return;
  }

  currentTurn = (currentTurn+1)%players.length;
  showTurn();
}

// ===== Update Scoreboard =====
function updateScore(){
  const tbody = document.getElementById("score");
  tbody.innerHTML = "";
  players.forEach(p=>{
    tbody.innerHTML += `<tr><td>${p.name}</td><td>${p.position}</td><td>${p.moves}</td></tr>`;
  });
}

// ===== Show Turn =====
function showTurn(){
  document.getElementById("turnInfo").innerText = `Turn: ${players[currentTurn].name}`;
}

// ===== Shortest Path (BFS) =====
function shortestPath(){
  const player = players[currentTurn];
  const start = player.position;
  const visited = Array(101).fill(false);
  const parent = Array(101).fill(-1);
  const queue = [start];
  visited[start] = true;

  while(queue.length){
    const node = queue.shift();
    if(node===100) break;
    for(let d=1;d<=6;d++){
      let next = node + d;
      if(next>100) continue;
      next = graph.get(next)||next;
      if(!visited[next]){
        visited[next] = true;
        parent[next] = node;
        queue.push(next);
      }
    }
  }

  // reconstruct path from 100 to start
  if(!visited[100]){
    alert('No path to 100 found (unexpected).');
    return;
  }
  const path = [];
  let cur = 100;
  while(cur!=-1 && cur !== 0){
    path.push(cur);
    if(cur === start) break;
    cur = parent[cur];
  }
  path.reverse();
  const moves = path.length - 1;
  // show path info and highlight cells
  document.getElementById('pathInfo').innerText = `${player.name} shortest path: ${moves} moves — ${path.join(' → ')}`;
  highlightShortestPath(path);
  document.getElementById('clearPathBtn').style.display = 'inline-block';
}

function highlightShortestPath(path){
  clearPath();
  path.forEach((n,idx)=>{
    const cell = document.getElementById(`cell-${n}`);
    if(!cell) return;
    cell.classList.add('path-cell');
    const badge = document.createElement('div');
    badge.className = 'path-step';
    badge.innerText = idx;
    cell.appendChild(badge);
  });
}

function clearPath(){
  document.querySelectorAll('.cell.path-cell').forEach(c=>{
    c.classList.remove('path-cell');
    const b = c.querySelector('.path-step'); if(b) b.remove();
  });
  document.getElementById('pathInfo').innerText = '';
  const btn = document.getElementById('clearPathBtn'); if(btn) btn.style.display = 'none';
}

// ===== Fetch & Render History =====
function fetchHistory(){
  const container = document.getElementById('history');
  // toggle
  if(container.getAttribute('data-open') === '1'){
    container.setAttribute('data-open','0');
    container.innerHTML = '';
    return;
  }
  container.setAttribute('data-open','1');
  container.innerHTML = '<em>Loading...</em>';
  fetch('/api/history')
    .then(r=>{ if(!r.ok) throw new Error('Network error'); return r.json(); })
    .then(data=>{
      renderHistory(data);
    })
    .catch(()=>{
      // fallback to localStorage history
      const history = JSON.parse(localStorage.getItem('winHistory')||'[]');
      renderHistory(history);
    });
}

function renderHistory(list){
  const container = document.getElementById('history');
  if(!list || !list.length){ container.innerHTML = '<small>No history found.</small>'; return; }
  let html = `<table class="history-table"><thead><tr><th>Player</th><th>Score</th><th>Result</th><th>Date</th></tr></thead><tbody>`;
  for(const row of list.slice(0,20)){
    const name = row.username || row;
    const score = row.score || '-';
    const result = row.result || '-';
    const date = row.played_on ? (new Date(row.played_on)).toLocaleString() : '-';
    html += `<tr><td>${name}</td><td>${score}</td><td>${result}</td><td>${date}</td></tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ===== Overlay toggle =====
function toggleOverlay(){
  window.enableOverlay = !window.enableOverlay;
  const board = document.getElementById('board');
  if(window.enableOverlay){
    renderSnakesLadders();
  } else {
    const old = document.getElementById('s-l-svg'); if(old) old.remove();
    document.querySelectorAll('#board image').forEach(img=>{ if(img.getAttribute('href')?.includes('snake')||img.getAttribute('href')?.includes('ladder')) img.remove(); });
  }
  const btn = document.getElementById('toggleOverlayBtn');
  if(btn) btn.innerText = window.enableOverlay ? '👁️ Hide Snakes/Ladders' : '👁️ Show Snakes/Ladders';
}

function setOverlayMode(mode){
  window.overlayMode = mode;
  // re-render overlay if enabled
  if(window.enableOverlay !== false) renderSnakesLadders();
}

// ===== Save Win History (frontend demo) =====
function saveWin(player){
  const obj = { username: player.name, score: player.moves || 0, result: 'win' };
  // Try to POST to backend API; fallback to localStorage if unavailable
  fetch('/api/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)})
    .then(r=>{ if(!r.ok) throw new Error('Network response not ok'); return r.json(); })
    .then(() => {
      showSavedToast(`${player.name} saved to history.`);
    })
    .catch(()=>{
      let history = JSON.parse(localStorage.getItem("winHistory")||"[]");
      history.push(obj);
      localStorage.setItem("winHistory",JSON.stringify(history));
      showSavedToast(`Saved locally: ${player.name}`);
    });
}

function showSavedToast(text){
  const el = document.createElement('div');
  el.style.position='fixed'; el.style.right='20px'; el.style.top='20px';
  el.style.background='rgba(0,0,0,0.7)'; el.style.color='white'; el.style.padding='8px 12px'; el.style.borderRadius='8px';
  el.innerText = text;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2000);
}
