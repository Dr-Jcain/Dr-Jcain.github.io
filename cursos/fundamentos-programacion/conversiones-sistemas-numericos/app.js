(function () {
  // La navegación, el menú lateral y el modo presentación se gestionan en /assets/lesson-shell.js.
  const input = document.getElementById('numberInput');
  const fromBase = document.getElementById('fromBase');
  const toBase = document.getElementById('toBase');
  const error = document.getElementById('converterError');
  const resultValue = document.getElementById('resultValue');
  const resultTitle = document.getElementById('resultTitle');
  const decimalValue = document.getElementById('decimalValue');
  const decomposition = document.getElementById('decomposition');
  const route = document.getElementById('conversionRoute');

  const DIGITS = '0123456789ABCDEF';
  const BASE_NAMES = { 2: 'Binario', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
  const SUBSCRIPTS = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
  const SUPERSCRIPTS = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };

  function subscript(value) {
    return String(value).split('').map(ch => SUBSCRIPTS[ch] || ch).join('');
  }

  function superscript(value) {
    return String(value).split('').map(ch => SUPERSCRIPTS[ch] || ch).join('');
  }

  function normalize(value) {
    return value.trim().replace(/[\s_]/g, '').toUpperCase();
  }

  function parseInBase(text, base) {
    const clean = normalize(text);
    if (!clean) throw new Error('Escribe un número para convertir.');
    let value = 0n;
    const b = BigInt(base);
    for (const ch of clean) {
      const digit = DIGITS.indexOf(ch);
      if (digit < 0 || digit >= base) {
        throw new Error(`El símbolo “${ch}” no es válido en base ${base}.`);
      }
      value = value * b + BigInt(digit);
    }
    return { value, clean };
  }

  function formatInBase(value, base) {
    if (value === 0n) return '0';
    const b = BigInt(base);
    let n = value;
    let out = '';
    while (n > 0n) {
      const digit = Number(n % b);
      out = DIGITS[digit] + out;
      n = n / b;
    }
    return out;
  }

  function makeDecomposition(clean, base, decimal) {
    const terms = [];
    const length = clean.length;
    [...clean].forEach((ch, index) => {
      const digit = DIGITS.indexOf(ch);
      const power = length - index - 1;
      terms.push(`${digit}×${base}${superscript(power)}`);
    });
    return `${terms.join(' + ')} = ${decimal.toString()}`;
  }

  function makeRoute(from, to) {
    if (from === to) return `${BASE_NAMES[from]} → ${BASE_NAMES[to]} (misma base)`;
    if (to === 10) return `${BASE_NAMES[from]} → decimal mediante suma posicional`;
    if (from === 10) return `Decimal → ${BASE_NAMES[to]} mediante divisiones sucesivas`;
    return `${BASE_NAMES[from]} → decimal → ${BASE_NAMES[to]}`;
  }

  function updateConverter() {
    if (!input || !fromBase || !toBase) return;
    const from = Number(fromBase.value);
    const to = Number(toBase.value);
    try {
      const parsed = parseInBase(input.value, from);
      const formatted = formatInBase(parsed.value, to);
      error.textContent = '';
      resultValue.textContent = `${formatted}${subscript(to)}`;
      resultTitle.textContent = `${BASE_NAMES[from]} → ${BASE_NAMES[to]}`;
      decimalValue.textContent = `${parsed.value.toString()}${subscript(10)}`;
      decomposition.textContent = makeDecomposition(parsed.clean, from, parsed.value);
      route.textContent = makeRoute(from, to);
    } catch (err) {
      error.textContent = err.message;
      resultValue.textContent = '—';
      resultTitle.textContent = 'Revisa la entrada';
      decimalValue.textContent = '—';
      decomposition.textContent = '—';
      route.textContent = '—';
    }
  }

  [input, fromBase, toBase].forEach(el => el?.addEventListener(el === input ? 'input' : 'change', updateConverter));

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.preset;
      fromBase.value = button.dataset.from;
      toBase.value = button.dataset.to;
      updateConverter();
    });
  });

  updateConverter();

  document.querySelectorAll('.quiz-card').forEach(card => {
    const answer = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach(btn => btn.classList.remove('correct','wrong'));
        const isCorrect = button.dataset.choice === answer;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) card.querySelector(`button[data-choice="${answer}"]`)?.classList.add('correct');
        feedback.textContent = isCorrect ? 'Correcto.' : 'Revisa la regla correspondiente y vuelve a intentarlo.';
      });
    });
  });
})();
