(() => {
  'use strict';
  const rack = document.getElementById('ramRack');
  const address = document.getElementById('memoryAddress');
  const data = document.getElementById('memoryData');
  const status = document.getElementById('memoryStatus');
  const addressBus = document.getElementById('addressBus');
  const dataBus = document.getElementById('dataBus');
  const controlBus = document.getElementById('controlBus');
  const base = 0x1000;
  const memory = [72, 111, 108, 97, 0, 42, 7, 255];

  function hexByte(v){ return '0x' + Number(v).toString(16).toUpperCase().padStart(2,'0'); }
  function addr(i){ return '0x' + (base+i).toString(16).toUpperCase(); }
  function render(active=-1){
    rack.innerHTML = memory.map((v,i)=>`<div class="ram-cell ${i===active?'active':''}"><span class="ram-address">${addr(i)}</span><strong class="ram-value">${v}</strong><span class="ram-meta">${hexByte(v)} · byte</span></div>`).join('');
  }
  for(let i=0;i<memory.length;i++) address.insertAdjacentHTML('beforeend', `<option value="${i}">${addr(i)}</option>`);
  function pulse(i, op, value){
    [addressBus,dataBus,controlBus].forEach(el=>el.classList.add('active'));
    addressBus.textContent = addr(i);
    dataBus.textContent = value;
    controlBus.textContent = op;
    render(i);
    setTimeout(()=>[addressBus,dataBus,controlBus].forEach(el=>el.classList.remove('active')),650);
  }
  document.getElementById('writeMemory').addEventListener('click',()=>{
    const i=Number(address.value); const v=Math.max(0,Math.min(255,Number(data.value)||0)); data.value=v; memory[i]=v;
    pulse(i,'WRITE',`${v} (${hexByte(v)}) → RAM`);
    status.className='memory-status ok'; status.textContent=`Escritura completada: ${v} quedó almacenado en ${addr(i)}.`;
  });
  document.getElementById('readMemory').addEventListener('click',()=>{
    const i=Number(address.value); const v=memory[i]; data.value=v;
    pulse(i,'READ',`RAM → ${v} (${hexByte(v)})`);
    status.className='memory-status ok'; status.textContent=`Lectura completada: ${addr(i)} contiene ${v}.`;
  });
  render();
})();
