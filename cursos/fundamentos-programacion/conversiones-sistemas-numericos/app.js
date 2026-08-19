(function () {
  const body = document.body;
  const menuButton = document.getElementById('menuButton');
  const focusButton = document.getElementById('focusButton');
  const toast = document.getElementById('toast');

  menuButton?.addEventListener('click', () => body.classList.toggle('nav-open'));

  focusButton?.addEventListener('click', () => {
    body.classList.toggle('presentation-mode');
    focusButton.textContent = body.classList.contains('presentation-mode')
      ? 'Mostrar temario'
      : 'Modo presentación';
  });

  document.querySelectorAll('.unit-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const links = button.nextElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (links) links.hidden = expanded;
    });
  });

  let toastTimer;
  document.querySelectorAll('[data-planned="true"]').forEach((button) => {
    button.addEventListener('click', () => {
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    });
  });

  document.querySelectorAll('[data-topic="conversiones"]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('sistemas')?.scrollIntoView({ behavior: 'smooth' });
      body.classList.remove('nav-open');
    });
  });

  // Quiz.
  document.querySelectorAll('.quiz-card').forEach((card) => {
    const correct = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach(btn => btn.classList.remove('is-right', 'is-wrong'));
        const good = button.dataset.choice === correct;
        button.classList.add(good ? 'is-right' : 'is-wrong');
        if (feedback) {
          feedback.className = 'quiz-feedback ' + (good ? 'ok' : 'no');
          feedback.textContent = good ? 'Correcto.' : 'Revisa el procedimiento y vuelve a intentarlo.';
        }
      });
    });
  });

  // Converter.
  const numberInput = document.getElementById('numberInput');
  const fromBase = document.getElementById('fromBase');
  const toBase = document.getElementById('toBase');
  const resultTitle = document.getElementById('resultTitle');
  const resultValue = document.getElementById('resultValue');
  const decimalValue = document.getElementById('decimalValue');
  const decomposition = document.getElementById('decomposition');
  const conversionRoute = document.getElementById('conversionRoute');
  const converterError = document.getElementById('converterError');
  const procedureHint = document.getElementById('procedureHint');

  const names = { 2: 'Binario', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' };
  const digitMap = '0123456789ABCDEF';
  const subDigits = { 0:'₀', 1:'₁', 2:'₂', 3:'₃', 4:'₄', 5:'₅', 6:'₆', 7:'₇', 8:'₈', 9:'₉', 10:'₁₀', 16:'₁₆' };

  function superscript(n) {
    return String(n).replace(/-/g, '⁻').replace(/0/g, '⁰').replace(/1/g, '¹').replace(/2/g, '²').replace(/3/g, '³').replace(/4/g, '⁴').replace(/5/g, '⁵').replace(/6/g, '⁶').replace(/7/g, '⁷').replace(/8/g, '⁸').replace(/9/g, '⁹');
  }

  function validForBase(text, base) {
    const upper = text.toUpperCase();
    const allowed = digitMap.slice(0, base);
    return [...upper].every(ch => allowed.includes(ch));
  }

  function parseInBase(text, base) {
    let value = 0;
    for (const ch of text.toUpperCase()) {
      value = value * base + digitMap.indexOf(ch);
    }
    return value;
  }

  function toBaseString(num, base) {
    if (num === 0) return '0';
    let n = num;
    const out = [];
    while (n > 0) {
      out.push(digitMap[n % base]);
      n = Math.floor(n / base);
    }
    return out.reverse().join('');
  }

  function toSubscript(base) {
    return base === 10 ? '₁₀' : base === 16 ? '₁₆' : base === 8 ? '₈' : '₂';
  }

  function positionalExpansion(text, base) {
    const chars = text.toUpperCase().split('');
    const exponents = chars.map((_, idx) => chars.length - 1 - idx);
    const terms = chars.map((ch, idx) => {
      const digit = digitMap.indexOf(ch);
      return `${digit}×${base}${superscript(exponents[idx])}`;
    });
    const total = chars.reduce((sum, ch, idx) => sum + digitMap.indexOf(ch) * Math.pow(base, exponents[idx]), 0);
    return `${terms.join(' + ')} = ${total}`;
  }

  function groupStringFromBinary(bin, size) {
    const pad = (size - (bin.length % size)) % size;
    const padded = '0'.repeat(pad) + bin;
    const groups = padded.match(new RegExp(`.{1,${size}}`, 'g')) || [padded];
    return { padded, groups };
  }

  function directBridge(text, from, to) {
    const upper = text.toUpperCase();
    if (from === 2 && to === 8) {
      const { groups } = groupStringFromBinary(upper, 3);
      return `${groups.join(' ')} → ${groups.map(g => parseInt(g, 2)).join(' ')} → ${toBaseString(parseInBase(upper, 2), 8)}`;
    }
    if (from === 8 && to === 2) {
      const groups = [...upper].map(ch => parseInt(ch, 8).toString(2).padStart(3, '0'));
      return `${[...upper].join(' ')} → ${groups.join(' ')} → ${groups.join('')}`;
    }
    if (from === 2 && to === 16) {
      const { groups } = groupStringFromBinary(upper, 4);
      return `${groups.join(' ')} → ${groups.map(g => digitMap[parseInt(g, 2)]).join(' ')} → ${toBaseString(parseInBase(upper, 2), 16)}`;
    }
    if (from === 16 && to === 2) {
      const groups = [...upper].map(ch => digitMap.indexOf(ch).toString(2).padStart(4, '0'));
      return `${[...upper].join(' ')} → ${groups.join(' ')} → ${groups.join('')}`;
    }
    if (from === 8 && to === 16) {
      const binaryGroups = [...upper].map(ch => parseInt(ch, 8).toString(2).padStart(3, '0'));
      const binary = binaryGroups.join('');
      const { groups } = groupStringFromBinary(binary, 4);
      const hex = groups.map(g => digitMap[parseInt(g, 2)]).join('');
      return `${[...upper].join(' ')} → ${binaryGroups.join(' ')} → ${groups.join(' ')} → ${hex}`;
    }
    if (from === 16 && to === 8) {
      const binaryGroups = [...upper].map(ch => digitMap.indexOf(ch).toString(2).padStart(4, '0'));
      const binary = binaryGroups.join('');
      const { groups } = groupStringFromBinary(binary, 3);
      const oct = groups.map(g => parseInt(g, 2)).join('');
      return `${[...upper].join(' ')} → ${binaryGroups.join(' ')} → ${groups.join(' ')} → ${oct}`;
    }
    return '';
  }

  function procedureText(from, to) {
    if (to === 10 && from !== 10) return `Suma ponderada con potencias de base ${from}.`;
    if (from === 10 && to !== 10) return `Divisiones sucesivas entre ${to} y lectura de residuos de abajo hacia arriba.`;
    if ((from === 2 && to === 8) || (from === 8 && to === 2)) return 'Conversión directa usando grupos de 3 bits.';
    if ((from === 2 && to === 16) || (from === 16 && to === 2)) return 'Conversión directa usando grupos de 4 bits.';
    if ((from === 8 && to === 16) || (from === 16 && to === 8)) return 'Conviene usar al binario como puente: 3 bits por dígito octal y 4 bits por dígito hexadecimal.';
    return 'No hay cambio de base.';
  }

  function render() {
    const text = (numberInput?.value || '').trim().toUpperCase();
    const from = Number(fromBase?.value || 10);
    const to = Number(toBase?.value || 10);

    resultTitle.textContent = `${names[from]} → ${names[to]}`;
    conversionRoute.textContent = `${names[from]} → ${names[to]}`;
    procedureHint.textContent = procedureText(from, to);

    if (!text) {
      converterError.textContent = 'Escribe un número para convertir.';
      resultValue.textContent = '—';
      decimalValue.textContent = '—';
      decomposition.textContent = '—';
      return;
    }

    if (!validForBase(text, from)) {
      converterError.textContent = `El número contiene símbolos no válidos para base ${from}.`;
      resultValue.textContent = '—';
      decimalValue.textContent = '—';
      decomposition.textContent = 'Revisa los dígitos permitidos en la base seleccionada.';
      return;
    }

    converterError.textContent = '';
    const decimal = parseInBase(text, from);
    const converted = toBaseString(decimal, to);
    resultValue.textContent = `${converted}${toSubscript(to)}`;
    decimalValue.textContent = String(decimal);

    if (from === to) {
      decomposition.textContent = `No hay cambio de base. El número permanece ${text}${toSubscript(from)}.`;
    } else if (to === 10 && from !== 10) {
      decomposition.textContent = positionalExpansion(text, from);
    } else if (from === 10 && to !== 10) {
      const steps = [];
      let n = decimal;
      if (n === 0) steps.push(`0 ÷ ${to} = 0, residuo 0`);
      while (n > 0) {
        const q = Math.floor(n / to);
        const r = n % to;
        steps.push(`${n} ÷ ${to} = ${q}, residuo ${digitMap[r]}`);
        n = q;
      }
      decomposition.textContent = `${steps.join(' | ')} → leído al revés: ${converted}`;
    } else {
      const bridge = directBridge(text, from, to);
      decomposition.textContent = bridge || `${text}${toSubscript(from)} → ${decimal}₁₀ → ${converted}${toSubscript(to)}`;
    }
  }

  [numberInput, fromBase, toBase].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  document.querySelectorAll('.converter-presets button').forEach((button) => {
    button.addEventListener('click', () => {
      numberInput.value = button.dataset.preset || '';
      fromBase.value = button.dataset.from || '10';
      toBase.value = button.dataset.to || '10';
      render();
      document.getElementById('laboratorio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  render();
})();
