import{i as u}from"./index-9XKf9tzy.js";const v=o=>String(o).padStart(2,"0");function C({root:o,deck:a,ctx:c}){const M="./";o.innerHTML=`
    <div class="ch-brand"><img src="${M}assets/logo-badge.png" alt=""><span>AVYRA</span></div>
    <div class="ch-chapter"><span class="num ltr" data-k="chnum">01</span><span data-k="chname"></span></div>
    <div class="ch-progress"><i data-k="bar"></i></div>
    <div class="ch-counter"><span class="num ltr" data-k="count">01 / 17</span><span class="ch-dots" data-k="dots"></span></div>
    <nav class="ch-tools" aria-label="أدوات العرض">
      <button data-act="next" title="التالي (→)">${u("chevL",26)}</button>
      <button data-act="prev" title="السابق (←)">${u("chevR",26)}</button>
      <span class="sep"></span>
      <button data-act="assistant" title="اسأل AVYRA (A)">${u("chat",24)}</button>
      <button data-act="overview" title="كل الشرائح (O)">${u("grid",24)}</button>
      <button data-act="presenter" title="عرض المقدّم (S)">${u("monitor",24)}</button>
      <button data-act="fullscreen" title="ملء الشاشة (F)">${u("maximize",24)}</button>
      <button data-act="help" title="الاختصارات (H)">${u("help",24)}</button>
    </nav>
    <div class="overview" data-k="overview" role="dialog" aria-label="كل الشرائح">
      <div class="ov-head"><h3>كل الشرائح</h3><span class="small">انقر للانتقال · Esc للإغلاق</span></div>
      <div class="ov-grid" data-k="ovgrid"></div>
    </div>
    <div class="help" data-k="help" role="dialog" aria-label="اختصارات لوحة المفاتيح">
      <div class="help-card glass">
        <h3>اختصارات العرض</h3>
        <dl>
          <dt><kbd>→</kbd> <kbd>Space</kbd> <kbd>PgDn</kbd></dt><dd>الخطوة / الشريحة التالية</dd>
          <dt><kbd>←</kbd> <kbd>PgUp</kbd></dt><dd>السابق</dd>
          <dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>البداية / النهاية</dd>
          <dt><kbd>1</kbd>…<kbd>17</kbd> ثم <kbd>Enter</kbd></dt><dd>انتقال مباشر لشريحة</dd>
          <dt><kbd>O</kbd></dt><dd>كل الشرائح</dd>
          <dt><kbd>F</kbd> <kbd>F5</kbd></dt><dd>ملء الشاشة</dd>
          <dt><kbd>A</kbd></dt><dd>اسأل AVYRA — مساعد الأسئلة</dd>
          <dt><kbd>S</kbd></dt><dd>نافذة المقدّم (ملاحظات + مؤقت)</dd>
          <dt><kbd>R</kbd></dt><dd>إعادة تشغيل الشريحة</dd>
          <dt><kbd>B</kbd> <kbd>.</kbd></dt><dd>شاشة سوداء (<kbd>Esc</kbd> للعودة)</dd>
        </dl>
      </div>
    </div>
    <div class="blackout" data-k="black"></div>
    <div class="jump num ltr" data-k="jump"></div>
  `;const i=t=>o.querySelector(`[data-k="${t}"]`),f=i("ovgrid");f.innerHTML=a.slides.map((t,e)=>`<button class="ov-card" data-i="${e}"><span class="ov-n num ltr">${v(e+1)}</span><span class="ov-ch">${t.chapter||""}</span><span class="ov-t">${t.title}</span></button>`).join(""),f.addEventListener("click",t=>{const e=t.target.closest(".ov-card");e&&(l(!1),a.go(+e.dataset.i,0))});let d=0;function l(t){const e=i("overview"),s=t??!e.classList.contains("show");e.classList.toggle("show",s),s&&(d=a.index,g())}function g(){f.querySelectorAll(".ov-card").forEach((t,e)=>{t.classList.toggle("sel",e===d),t.classList.toggle("cur",e===a.index)})}const p=t=>i("help").classList.toggle("show",t??!i("help").classList.contains("show")),y=()=>i("black").classList.toggle("show");function h(){document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.({navigationUI:"hide"}).catch(()=>{})}function A(){const t=`${location.pathname}?presenter${location.hash}`;window.open(t,"avyra-presenter","width=1360,height=820")}o.querySelector(".ch-tools").addEventListener("click",t=>{const e=t.target.closest("button");if(!e)return;const s=e.dataset.act;s==="next"&&a.next(),s==="prev"&&a.prev(),s==="overview"&&l(),s==="help"&&p(),s==="fullscreen"&&h(),s==="presenter"&&A(),s==="assistant"&&c.assistant?.toggle(),e.blur()}),a.on(({index:t,step:e,steps:s,total:b})=>{const n=a.slides[t];i("chnum").textContent=v(t+1),i("chname").textContent=n.chapter||"",o.querySelector(".ch-chapter").classList.toggle("hide",!!n.hideChrome||!n.chapter),o.querySelector(".ch-brand").classList.toggle("hide",!!n.hideBrand),i("count").textContent=`${v(t+1)} / ${v(b)}`,i("bar").style.transform=`scaleX(${(t+(s>1?e/s:0)+1)/b})`,i("dots").innerHTML=s>1?Array.from({length:s},($,k)=>`<i class="${k<=e?"on":""}"></i>`).join(""):"",g()});function K(){i("help").classList.contains("show")?p(!1):i("overview").classList.contains("show")?l(!1):c.assistant?.isOpen()?c.assistant.close():i("black").classList.contains("show")&&y()}function m(t){p(!1),l(!1),c.assistant?.isOpen()&&c.assistant.close(),t>0?a.next():a.prev()}window.addEventListener("keydown",t=>{t.ctrlKey||t.metaKey||t.altKey||(t.key==="F5"?(t.preventDefault(),t.stopPropagation(),document.fullscreenElement||h()):(t.key==="PageDown"||t.key==="PageUp")&&(t.preventDefault(),t.stopPropagation(),m(t.key==="PageDown"?1:-1)))},!0),("BroadcastChannel"in window?new BroadcastChannel("avyra-deck"):null)?.addEventListener("message",t=>{const e=t.data||{};e.type==="cmd"&&(e.cmd==="black"&&y(),e.cmd==="escape"&&K())});let r="",S=0;const w=()=>{i("jump").textContent=r,i("jump").classList.toggle("show",!!r)};window.addEventListener("keydown",t=>{const e=t.target;if(e&&(e.tagName==="INPUT"&&!/^(range|checkbox|radio|button|submit|reset)$/i.test(e.type)||e.tagName==="TEXTAREA"||e.isContentEditable)){t.key==="Escape"&&(e.blur(),c.assistant?.close());return}if(t.ctrlKey||t.metaKey||t.altKey)return;const b=i("overview").classList.contains("show"),n=t.code;if(b){if(t.key==="Escape"||n==="KeyO"||n==="KeyG"){l(!1),t.preventDefault();return}if(t.key==="ArrowLeft")d=Math.min(a.total-1,d+1);else if(t.key==="ArrowRight")d=Math.max(0,d-1);else if(t.key==="ArrowDown")d=Math.min(a.total-1,d+5);else if(t.key==="ArrowUp")d=Math.max(0,d-5);else if(t.key==="Enter"||t.key===" ")l(!1),a.go(d,0);else return;g(),t.preventDefault();return}if(/^[0-9]$/.test(t.key)||/^Digit[0-9]$/.test(n)){const k=/^[0-9]$/.test(t.key)?t.key:n.slice(5);r=(r+k).slice(-2),clearTimeout(S),S=setTimeout(()=>{r="",w()},1800),w();return}if(t.key==="Enter"&&r){a.go(parseInt(r,10)-1,0),r="",w(),t.preventDefault();return}let $=!0;switch(!0){case(t.key==="ArrowRight"||t.key==="ArrowDown"||t.key===" "&&!t.shiftKey||n==="KeyN"):m(1);break;case(t.key==="ArrowLeft"||t.key==="ArrowUp"||t.key==="Backspace"||t.key===" "&&t.shiftKey):m(-1);break;case t.key==="Home":a.go(0,0);break;case t.key==="End":a.go(a.total-1,0);break;case n==="KeyF":h();break;case(n==="KeyO"||n==="KeyG"):l();break;case t.key==="Escape":K();break;case(n==="KeyH"||t.key==="?"):p();break;case(n==="KeyB"||n==="Period"):y();break;case n==="KeyA":c.assistant?.toggle();break;case(n==="KeyS"||n==="KeyP"):A();break;case n==="KeyR":a.replay();break;default:$=!1}$&&t.preventDefault()});let T=0,D=0,L=!1;window.addEventListener("touchstart",t=>{t.touches.length===1&&(L=!0,T=t.touches[0].clientX,D=t.touches[0].clientY)},{passive:!0}),window.addEventListener("touchend",t=>{if(!L)return;L=!1;const e=t.changedTouches[0],s=e.clientX-T,b=e.clientY-D;if(Math.abs(s)>70&&Math.abs(s)>Math.abs(b)*1.5){if(t.target.closest("input, .range, .no-swipe, .assistant"))return;s>0?a.next():a.prev()}});let x=0;const E=()=>{document.body.classList.remove("idle"),o.classList.add("awake"),clearTimeout(x),x=setTimeout(()=>{document.body.classList.add("idle"),o.classList.remove("awake")},2600)};return window.addEventListener("mousemove",E,{passive:!0}),window.addEventListener("pointerdown",E,{passive:!0}),E(),{toggleOverview:l,toggleHelp:p,fullscreen:h}}export{C as createChrome};
