(() => {
  'use strict';

  const startInput = document.getElementById('startN');
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const runButton = document.getElementById('runTrace');
  const gotoCode = document.getElementById('gotoCode');
  const structuredCode = document.getElementById('structuredCode');
  const codeHeader = document.getElementById('codeHeader');
  const traceTitle = document.getElementById('traceTitle');
  const traceList = document.getElementById('traceList');
  const traceOutput = document.getElementById('traceOutput');
  let mode = 'goto';

  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.mode === mode));
    gotoCode.hidden = mode !== 'goto';
    structuredCode.hidden = mode !== 'structured';
    codeHeader.textContent = mode === 'goto' ? 'Pseudocódigo con saltos' : 'Pseudocódigo estructurado';
    traceTitle.textContent = mode === 'goto' ? 'Programa con saltos' : 'Programa estructurado';
    renderTrace();
  }

  function makeTrace(n, currentMode) {
    const trace = [];
    const output = [];
    if (currentMode === 'goto') {
      while (true) {
        trace.push(`L10(n=${n})`);
        if (n <= 0) {
          trace.push('L50');
          output.push('Fin');
          break;
        }
        trace.push('L20'); output.push(String(n));
        trace.push('L30'); n -= 1;
        trace.push('L40');
      }
    } else {
      while (true) {
        trace.push(`while(n=${n})`);
        if (n <= 0) break;
        trace.push('print'); output.push(String(n));
        trace.push('n--'); n -= 1;
      }
      trace.push('print Fin'); output.push('Fin');
    }
    return { trace, output };
  }

  function renderTrace() {
    if (!traceList) return;
    let n = Math.trunc(Number(startInput.value));
    if (!Number.isFinite(n)) n = 3;
    n = Math.max(1, Math.min(8, n));
    startInput.value = String(n);
    const result = makeTrace(n, mode);
    traceList.innerHTML = result.trace.map(step => `<span>${step}</span>`).join('');
    traceOutput.textContent = result.output.join(', ');

    document.querySelectorAll('.execution-code [data-line]').forEach(el => el.classList.remove('is-executed'));
    if (mode === 'goto') {
      [...new Set(result.trace.map(s => s.slice(0,3)).filter(s => /^L\d\d$/.test(s)))].forEach(line => {
        document.querySelector(`.execution-code [data-line="${line}"]`)?.classList.add('is-executed');
      });
    } else {
      document.querySelectorAll('#structuredCode [data-line]').forEach(el => el.classList.add('is-executed'));
    }
  }

  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  runButton?.addEventListener('click', renderTrace);
  startInput?.addEventListener('change', renderTrace);
  setMode('goto');
})();
