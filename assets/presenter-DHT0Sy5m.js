import{i as d}from"./index-9XKf9tzy.js";const o=a=>String(a).padStart(2,"0");function x(a){document.title="AVYRA · عرض المقدّم",document.body.className="presenter",document.body.innerHTML=`
    <div class="pv">
      <header class="pv-top">
        <b>AVYRA · عرض المقدّم</b>
        <span class="pv-sync" id="sync">بانتظار نافذة العرض…</span>
        <span class="pv-clock num ltr" id="clock"></span>
        <span class="pv-timer"><span class="num ltr" id="elapsed">00:00</span><button id="reset" title="إعادة المؤقت">${d("rotate",22)}</button></span>
      </header>
      <section class="pv-main">
        <div class="pv-cur">
          <div class="pv-meta"><span class="num ltr" id="n">--</span><span id="ch"></span><span class="pv-steps" id="steps"></span></div>
          <h1 id="title"></h1>
          <div class="pv-notes" id="notes"></div>
        </div>
        <aside class="pv-side">
          <span class="pv-lbl">التالي</span>
          <h2 id="next"></h2>
          <div class="pv-btns">
            <button id="prev">${d("chevR",28)} السابق</button>
            <button id="nextb" class="primary">التالي ${d("chevL",28)}</button>
          </div>
          <ol class="pv-list" id="list">${a.map((t,e)=>`<li data-i="${e}"><span class="num ltr">${o(e+1)}</span>${t.title}</li>`).join("")}</ol>
        </aside>
      </section>
    </div>`;const n=t=>document.getElementById(t),c="BroadcastChannel"in window?new BroadcastChannel("avyra-deck"):null,s=(t,e={})=>c?.postMessage({type:"cmd",cmd:t,...e}),p="avyra-presenter-t0";let i=0;try{i=+sessionStorage.getItem(p)||0}catch{}const r=t=>{i=t;try{sessionStorage.setItem(p,String(t))}catch{}};let v=a.length;function m(t){const e=a[t.index];n("sync").textContent="متصل",n("sync").classList.add("ok"),n("n").textContent=`${o(t.index+1)} / ${o(t.total)}`,n("ch").textContent=e.chapter||"",n("title").textContent=e.title,n("steps").innerHTML=t.steps>1?`الخطوة <span class="num ltr">${t.step+1}/${t.steps}</span>`:"",n("notes").textContent=e.notes||"";const l=t.step<t.steps-1?`${e.title} — الخطوة ${t.step+2}`:a[t.index+1]?.title||"— نهاية العرض —";n("next").textContent=l,document.querySelectorAll("#list li").forEach(u=>u.classList.toggle("cur",+u.dataset.i===t.index)),v=t.total,i||r(Date.now())}c?.addEventListener("message",t=>{t.data?.type==="state"&&m(t.data)}),c?.postMessage({type:"hello"}),n("prev").onclick=()=>s("prev"),n("nextb").onclick=()=>s("next"),n("reset").onclick=()=>r(Date.now()),n("list").onclick=t=>{const e=t.target.closest("li");e&&s("go",{index:+e.dataset.i})},window.addEventListener("keydown",t=>{if(t.ctrlKey||t.metaKey||t.altKey)return;const e=t.key;let l=!0;e==="F5"||(["ArrowRight","ArrowDown","PageDown"," "].includes(e)?s("next"):["ArrowLeft","ArrowUp","PageUp"].includes(e)?s("prev"):e==="Home"?s("go",{index:0}):e==="End"?s("go",{index:v-1}):t.code==="KeyB"||t.code==="Period"?s("black"):e==="Escape"?s("escape"):l=!1),l&&t.preventDefault()}),setInterval(()=>{if(n("clock").textContent=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}),i){const t=Math.floor((Date.now()-i)/1e3);n("elapsed").textContent=`${o(Math.floor(t/60))}:${o(t%60)}`}},500)}export{x as initPresenter};
