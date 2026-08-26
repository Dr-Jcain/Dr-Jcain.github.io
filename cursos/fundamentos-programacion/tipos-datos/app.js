(() => {
  'use strict';
  const charInput=document.getElementById('charInput'), charGlyph=document.getElementById('charGlyph'), charCode=document.getElementById('charCode'), charBits=document.getElementById('charBits');
  function renderChar(){ const ch=(charInput.value||' ').charAt(0); const code=ch.charCodeAt(0); charGlyph.textContent=ch===' '?'␠':ch; charCode.textContent=`Código decimal: ${code}`; charBits.textContent=(code&255).toString(2).padStart(8,'0'); }
  charInput.addEventListener('input',renderChar); renderChar();

  const intInput=document.getElementById('intInput'), intBits=document.getElementById('intBits'), intRow=document.getElementById('intBitRow'), intProcess=document.getElementById('intProcess'), intError=document.getElementById('intError'), intTitle=document.getElementById('intResultTitle');
  function renderInt(){
    const bits=Number(intBits.value); let n=Math.trunc(Number(intInput.value)||0); const min=-(2**(bits-1)), max=2**(bits-1)-1;
    intError.textContent=''; if(n<min||n>max){intError.textContent=`Para ${bits} bits usa valores entre ${min} y ${max}.`; intRow.innerHTML=''; intProcess.textContent=''; return;}
    const mod=2**bits; const unsigned=n<0?mod+n:n; const bin=unsigned.toString(2).padStart(bits,'0');
    intTitle.textContent=`${n} en ${bits} bits`; intRow.innerHTML=[...bin].map((b,i)=>`<span class="bit ${i===0?'sign':''}">${b}</span>`).join('');
    if(n<0){ const mag=Math.abs(n).toString(2).padStart(bits,'0'); const inv=[...mag].map(b=>b==='0'?'1':'0').join(''); intProcess.textContent=`|${n}|: ${mag}  → invertir: ${inv}  → +1: ${bin}`; }
    else intProcess.textContent=`Valor positivo: ${bin}`;
  }
  intInput.addEventListener('input',renderInt); intBits.addEventListener('change',renderInt); renderInt();

  const floatInput=document.getElementById('floatInput'), sign=document.getElementById('ieeeSign'), exp=document.getElementById('ieeeExponent'), frac=document.getElementById('ieeeFraction'), frow=document.getElementById('floatBitRow'), explain=document.getElementById('floatExplain');
  function renderFloat(){
    const v=Number(floatInput.value)||0; const buf=new ArrayBuffer(4); const dv=new DataView(buf); dv.setFloat32(0,v,false); const u=dv.getUint32(0,false); const bin=u.toString(2).padStart(32,'0'); const s=bin[0], e=bin.slice(1,9), f=bin.slice(9); const stored=parseInt(e,2); const unbiased=stored-127;
    sign.textContent=s; exp.textContent=e; frac.textContent=f; frow.innerHTML=[...bin].map((b,i)=>`<span class="bit ${i===0?'sign':i<=8?'exponent':'fraction'}">${b}</span>`).join('');
    explain.textContent=`Float32(${v}) → signo=${s}, exponente almacenado=${stored}${stored>0&&stored<255?`, exponente real=${unbiased}`:''}, fracción=${f}`;
  }
  floatInput.addEventListener('input',renderFloat); renderFloat();
})();
