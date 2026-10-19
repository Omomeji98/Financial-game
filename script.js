(() => {
"use strict";

const CHAMBERS = [
  {id:"simple", name:"Simple Interest", subtitle:"Make your money grow at a constant rate.", formula:"I = P × r × t     |     A = P + I", description:"Simple interest is calculated on the original principal only. P is principal, r is the annual interest rate as a decimal, t is time in years, I is interest, and A is the final amount."},
  {id:"compound", name:"Compound Interest", subtitle:"Earn interest on interest.", formula:"A = P(1 + r)ⁿ", description:"Compound interest adds earned interest to the balance, so future interest is calculated on the new balance. This chamber uses annual compounding. P is the starting principal, r is the annual rate, and n is the number of years."},
  {id:"appreciation", name:"Appreciation", subtitle:"Watch an asset increase in value.", formula:"V = P(1 + r)ⁿ", description:"Appreciation is an increase in value over time. P is the initial value, r is the annual appreciation rate, and n is the number of years."},
  {id:"depreciation", name:"Depreciation", subtitle:"Calculate how an asset loses value.", formula:"V = P(1 − r)ⁿ", description:"Reducing-balance depreciation applies the same percentage decrease to the asset's value each year. P is the initial value, r is the annual depreciation rate, and n is the number of years."},
  {id:"annuity", name:"Annuity", subtitle:"Understand equal payments made regularly.", formula:"FV = PMT × ((1 + i)ⁿ − 1) / i\nPV = PMT × (1 − (1 + i)⁻ⁿ) / i", description:"An ordinary annuity consists of equal payments made at the end of each period. FV is future value, PV is present value, PMT is each payment, i is the rate per period, and n is the number of periods. This chamber uses annual periods."},
  {id:"amortization", name:"Amortization", subtitle:"Find the regular payment needed to repay a loan.", formula:"PMT = PV × i / (1 − (1 + i)⁻ⁿ)", description:"Amortization repays a loan through regular payments that cover interest and reduce the amount owed. PV is the loan amount, i is the rate per period, n is the number of payments, and PMT is each payment. This chamber uses annual payments."}
];
const SETTINGS = {
  Easy:{principal:[10000,100000],rate:[5,10],years:[1,4],payment:[5000,25000]},
  Normal:{principal:[50000,500000],rate:[4,15],years:[2,8],payment:[10000,80000]},
  Hard:{principal:[100000,2000000],rate:[6,20],years:[3,12],payment:[20000,200000]}
};
const $ = id => document.getElementById(id);
const money = n => "₦" + n.toLocaleString("en-NG",{minimumFractionDigits:2,maximumFractionDigits:2});
const int = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
const chamberById = id => CHAMBERS.find(c=>c.id===id);

let state = freshState();
function freshState() {
  return {player:"Player",difficulty:"Easy",score:0,lives:3,unlocked:1,completed:{},
    chamberIndex:0,qIndex:0,questions:[],current:null,hintUsed:false,firstTry:0,
    correctCount:0,vaultQuestions:[],vaultIndex:0,vaultCorrect:0,mode:"chamber"};
}
function loadBest() { try { return JSON.parse(localStorage.getItem("aceworldFinancialEscapeBest")||'{"best_score":0,"best_player":"Player"}'); } catch { return {best_score:0,best_player:"Player"}; } }
let best = loadBest();
function saveBest() {
  best.best_score=Math.max(Number(best.best_score)||0,state.score);
  best.best_player=state.player;
  try { localStorage.setItem("aceworldFinancialEscapeBest",JSON.stringify(best)); } catch {}
}
function shell(html) { $("app").innerHTML=html; }
function topbar(title) {
  return `<header class="topbar"><h2>${title}</h2><div class="stats"><span>Score: ${state.score.toLocaleString()}</span><span>Lives: ${"♥ ".repeat(state.lives)}</span></div></header>`;
}
function button(label, action, cls="") { return `<button class="${cls}" data-action="${action}">${label}</button>`; }
function welcome() {
  shell(`<section class="screen welcome">
    <h1>🔐 FINANCIAL ESCAPE ROOM</h1><h2 style="color:var(--text)">THE MATHEMATICS OF MONEY</h2>
    <p class="muted">Solve real-life money problems, unlock six chambers, and open the final vault.</p>
    <div class="panel form-panel">
      <label for="playerName">Enter your name</label><input id="playerName" maxlength="30" value="Player">
      <label for="difficulty">Choose difficulty</label><select id="difficulty"><option>Easy</option><option>Normal</option><option>Hard</option></select>
      <div class="actions">${button("ENTER THE ESCAPE ROOM ➜","start")}</div>
    </div>
    <p class="muted center">Best score saved in this browser: ${Number(best.best_score||0).toLocaleString()} points<br>Enter numerical answers; commas and ₦ are accepted.</p>
  </section>`);
}
function start() {
  state=freshState();
  state.player=($("playerName").value.trim()||"Player").slice(0,30);
  state.difficulty=$("difficulty").value;
  mapScreen();
}
function mapScreen() {
  const tiles=CHAMBERS.map((c,i)=>{
    const unlocked=i<state.unlocked, done=!!state.completed[c.id];
    return `<article class="tile ${unlocked?"":"locked"}"><h3>${i+1}. ${c.name}</h3><p>${c.subtitle}</p>
      <div class="status ${done?"done":""}">${done?"✓ COMPLETED":unlocked?"UNLOCKED":"LOCKED"}</div>
      ${unlocked?button(done?"Review":"Enter chamber",`enter:${i}`,"secondary"):""}</article>`;
  }).join("");
  shell(`${topbar("MISSION MAP")}<section class="screen"><p class="muted">Welcome, ${escapeHtml(state.player)}. Complete all six chambers to reach the Final Vault.</p>
    <div class="map-grid">${tiles}</div><div class="actions">
    ${Object.keys(state.completed).length===CHAMBERS.length?button("ENTER THE FINAL VAULT ➜","vault"):""}
    ${button("How to play","instructions","secondary")}${button("Restart game","restart","secondary")}
    </div></section>`);
}
function escapeHtml(s) { return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

function makeQuestion(id,difficulty) {
  const s=SETTINGS[difficulty], p=int(...s.principal), ratePct=int(...s.rate), r=ratePct/100;
  const years=int(...s.years); let payment=Math.round(int(...s.payment)/1000)*1000;
  let answer,prompt,solution;
  if(id==="simple") {
    const interest=p*r*years;
    if(Math.random()<.5) {answer=interest;prompt=`You invest ${money(p)} at ${ratePct}% simple interest per year for ${years} year(s). How much interest will you earn?`;
      solution=`I = P × r × t = ${money(p)} × ${r.toFixed(4)} × ${years} = ${money(answer)}.`;}
    else {answer=p+interest;prompt=`You invest ${money(p)} at ${ratePct}% simple interest per year for ${years} year(s). What is the final amount?`;
      solution=`I = P × r × t = ${money(p)} × ${r.toFixed(4)} × ${years} = ${money(interest)}. A = P + I = ${money(answer)}.`;}
  } else if(id==="compound"||id==="appreciation") {
    answer=p*(1+r)**years;
    prompt=id==="compound"?`You deposit ${money(p)} at ${ratePct}% annual compound interest. What will the balance be after ${years} year(s)?`:`A property is currently worth ${money(p)} and appreciates by ${ratePct}% each year. What will it be worth after ${years} year(s)?`;
    solution=`${id==="compound"?"A":"V"} = P(1 + r)ⁿ = ${money(p)} × (1 + ${r.toFixed(4)})^${years} = ${money(answer)}.`;
  } else if(id==="depreciation") {
    const rp=Math.min(ratePct,40), rr=rp/100; answer=p*(1-rr)**years;
    prompt=`A machine worth ${money(p)} depreciates by ${rp}% each year using the reducing-balance method. What is its value after ${years} year(s)?`;
    solution=`V = P(1 − r)ⁿ = ${money(p)} × (1 − ${rr.toFixed(4)})^${years} = ${money(answer)}.`;
  } else if(id==="annuity") {
    if(Math.random()<.5) {answer=payment*((1+r)**years-1)/r;
      prompt=`You save ${money(payment)} at the end of every year in an account earning ${ratePct}% annually. How much will the savings be worth immediately after the ${years}th payment?`;
      solution=`FV = PMT × ((1 + i)ⁿ − 1) / i = ${money(payment)} × ((1 + ${r.toFixed(4)})^${years} − 1) / ${r.toFixed(4)} = ${money(answer)}.`;}
    else {answer=payment*(1-(1+r)**(-years))/r;
      prompt=`You will receive ${money(payment)} at the end of every year for ${years} year(s). If the annual discount rate is ${ratePct}%, what is the present value of those payments?`;
      solution=`PV = PMT × (1 − (1 + i)⁻ⁿ) / i = ${money(payment)} × (1 − (1 + ${r.toFixed(4)})^(-${years})) / ${r.toFixed(4)} = ${money(answer)}.`;}
  } else {
    answer=p*r/(1-(1+r)**(-years));
    prompt=`You borrow ${money(p)} at ${ratePct}% interest per year and repay it with ${years} equal end-of-year payments. What is each annual payment?`;
    solution=`PMT = PV × i / (1 − (1 + i)⁻ⁿ) = ${money(p)} × ${r.toFixed(4)} / (1 − (1 + ${r.toFixed(4)})^(-${years})) = ${money(answer)}.`;
  }
  return {prompt,answer:Number(answer.toFixed(2)),solution,hint:chamberById(id).formula,chamber_id:id};
}
function enterChamber(i) {
  if(i>=state.unlocked)return;
  state.chamberIndex=i;state.qIndex=0;state.firstTry=0;state.correctCount=0;state.mode="chamber";
  state.questions=Array.from({length:5},()=>makeQuestion(CHAMBERS[i].id,state.difficulty));
  showQuestion();
}
function showQuestion() {
  if(state.lives<=0)return gameOver();
  state.current=state.questions[state.qIndex];state.hintUsed=false;
  const c=CHAMBERS[state.chamberIndex];
  shell(`${topbar(c.name)}<section class="screen">
    <div class="question-meta">Question ${state.qIndex+1} of 5 · Difficulty: ${state.difficulty}</div>
    <div class="panel"><p class="muted">${c.description}</p><div class="formula">Formula reference: ${c.formula}</div></div>
    <div class="panel"><div class="gold"><strong>YOUR CHALLENGE</strong></div><p class="challenge">${state.current.prompt}</p>
      <div class="answer-line"><label for="answer" style="margin:0">Your answer:</label><input id="answer" inputmode="decimal" autocomplete="off" placeholder="Enter amount or number"></div>
      <div id="feedback" class="feedback" role="status"></div>
    </div>
    <div class="actions">${button("Check Answer","check")}${button("Show Formula (−25 points)","hint","secondary")}${button("Back to Map","map","secondary")}</div>
  </section>`);
  $("answer").addEventListener("keydown",e=>{if(e.key==="Enter")checkAnswer();});
  $("answer").focus();
}
function parseAnswer(raw) {
  const cleaned=raw.trim().replace(/[₦,\s]/g,"");
  if(!cleaned)throw Error("Enter a number first.");
  const value=Number(cleaned); if(!Number.isFinite(value))throw Error("Please enter a valid number."); return value;
}
function checkAnswer() {
  if(state.lives<=0||!state.current)return;
  let value;try{value=parseAnswer($("answer").value);}catch(e){feedback(e.message,"hint");return;}
  const expected=state.current.answer,tolerance=Math.max(1,Math.abs(expected)*.01);
  if(Math.abs(value-expected)<=tolerance) {
    state.correctCount++;
    if(!state.hintUsed){state.score+=100;state.firstTry++;}else state.score+=75;
    feedback(`Correct! ${state.hintUsed?"+75 points (hint used)":"+100 points"}\n${state.current.solution}`,"good");
    $("answer").disabled=true;
    const check=$('check'); if(check){check.textContent="Next Question ➜";check.dataset.action="next";}
    refreshTopbar();
  } else {
    state.lives--;feedback("Not quite. One life used. Try again.\nYour answer is not within 1% of the expected value.","bad");
    refreshTopbar(); if(state.lives<=0)setTimeout(gameOver,900);
  }
}
function feedback(text,cls){const el=$("feedback");if(el){el.textContent=text;el.className="feedback "+cls;}}
function refreshTopbar(){const old=document.querySelector(".topbar");if(old)old.outerHTML=topbar(state.mode==="vault"?"🔓 THE FINAL VAULT":CHAMBERS[state.chamberIndex].name);}
function hint() {
  if(state.hintUsed){feedback("You have already used the hint for this question.","hint");return;}
  state.hintUsed=true;state.score=Math.max(0,state.score-25);
  feedback(`Hint: ${state.current.hint}\nRemember to write the rate as a decimal (for example, 8% = 0.08).`,"hint");refreshTopbar();
}
function nextQuestion(){state.qIndex++;if(state.qIndex<state.questions.length)showQuestion();else finishChamber();}
function finishChamber(){
  const c=CHAMBERS[state.chamberIndex],bonus=state.firstTry*20;state.score+=bonus;
  state.completed[c.id]={first_try:state.firstTry,correct:state.correctCount,bonus};
  state.unlocked=Math.max(state.unlocked,Math.min(CHAMBERS.length,state.chamberIndex+2));saveBest();
  shell(`${topbar("CHAMBER COMPLETE")}<section class="screen center"><h1>Well done, ${escapeHtml(state.player)}!</h1><h2 style="color:var(--text)">You completed: ${c.name}</h2>
    <div class="panel summary">First-try correct answers: ${state.firstTry}/5\nQuestions solved: ${state.correctCount}/5\nAccuracy bonus: +${bonus} points\nCurrent score: ${state.score.toLocaleString()}</div>
    <p class="gold">Every financial decision gets easier when you understand the mathematics behind it.</p>
    ${button("RETURN TO MISSION MAP ➜","map")}</section>`);
}
function startVault(){
  if(Object.keys(state.completed).length!==CHAMBERS.length){alert("Complete all six chambers before entering the Final Vault.");return;}
  state.vaultQuestions=Array.from({length:5},()=>makeQuestion(pick(CHAMBERS).id,state.difficulty));
  state.vaultIndex=0;state.vaultCorrect=0;state.mode="vault";showVaultQuestion();
}
function showVaultQuestion(){
  if(state.lives<=0)return gameOver();
  state.current=state.vaultQuestions[state.vaultIndex];state.hintUsed=false;
  const c=chamberById(state.current.chamber_id);
  shell(`${topbar("🔓 THE FINAL VAULT")}<section class="screen">
    <div class="question-meta">Mixed challenge ${state.vaultIndex+1} of ${state.vaultQuestions.length}</div>
    <div class="panel"><div class="formula">TOPIC: ${c.name.toUpperCase()}</div><p class="challenge">${state.current.prompt}</p>
      <div class="answer-line"><label for="answer" style="margin:0">Your answer:</label><input id="answer" inputmode="decimal" autocomplete="off" placeholder="Enter amount or number"></div>
      <div id="feedback" class="feedback" role="status"></div></div>
    <div class="actions">${button("Check Answer","vaultCheck")}${button("Show Formula (−25 points)","vaultHint","secondary")}</div>
  </section>`);
  $("answer").addEventListener("keydown",e=>{if(e.key==="Enter")checkVaultAnswer();});$("answer").focus();
}
function checkVaultAnswer(){
  if(state.lives<=0)return;
  let value;try{value=parseAnswer($("answer").value);}catch(e){feedback(e.message,"hint");return;}
  const expected=state.current.answer,tol=Math.max(1,Math.abs(expected)*.01);
  if(Math.abs(value-expected)<=tol){
    state.vaultCorrect++;state.score+=state.hintUsed?150:200;
    feedback(`Correct!\n${state.current.solution}`,"good");$("answer").disabled=true;
    const check=$('vaultCheck');if(check){check.textContent="Next Challenge ➜";check.dataset.action="vaultNext";}refreshTopbar();
  } else {state.lives--;feedback("Not quite. One life used. Try again.","bad");refreshTopbar();if(state.lives<=0)setTimeout(gameOver,900);}
}
function vaultHint(){
  if(state.hintUsed){feedback("You have already used this hint.","hint");return;}
  state.hintUsed=true;state.score=Math.max(0,state.score-25);feedback(`Hint: ${state.current.hint}`,"hint");refreshTopbar();
}
function nextVault(){state.vaultIndex++;if(state.vaultIndex<state.vaultQuestions.length)showVaultQuestion();else victory();}
function victory(){
  saveBest();
  shell(`<section class="screen center"><h1 class="gold">🏆 VAULT UNLOCKED!</h1><h2>Congratulations, ${escapeHtml(state.player)}!</h2>
    <div class="panel summary">You completed all six financial mathematics chambers and the Final Vault.\n\nVault answers correct: ${state.vaultCorrect}/${state.vaultQuestions.length}\nFinal score: ${state.score.toLocaleString()} points\nBest score on this browser: ${Number(best.best_score).toLocaleString()} points</div>
    <p class="muted">You have escaped by using mathematics to understand money.</p>
    ${button("PLAY AGAIN","restart")}</section>`);
}
function gameOver(){
  saveBest();
  shell(`<section class="screen center"><h1 style="color:var(--red)">⏳ GAME OVER</h1><h2 style="color:var(--text)">You have used all three lives.</h2>
    <div class="panel summary">Score: ${state.score.toLocaleString()} points\nBest score: ${Number(best.best_score).toLocaleString()} points\n\nReview the formulas and try again. Every attempt is practice.</div>
    ${button("TRY AGAIN","restart")}</section>`);
}
function instructions(){
  alert("1. Enter an unlocked chamber and solve five questions.\\n2. Type a numerical answer, then press Check Answer or Enter.\\n3. A wrong answer costs one life. You have three lives for the whole game.\\n4. Show Formula gives a hint and costs 25 points.\\n5. Correct answers earn points. Complete all six chambers to unlock the Final Vault.\\n\\nAmounts are in Nigerian naira. Rates and payments are annual. Answers may include commas or ₦.");
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-action]");if(!b)return;
  const a=b.dataset.action;
  if(a==="start")start();else if(a==="map")mapScreen();else if(a==="instructions")instructions();
  else if(a==="restart")welcome();else if(a==="vault")startVault();
  else if(a.startsWith("enter:"))enterChamber(Number(a.split(":")[1]));
  else if(a==="check")checkAnswer();else if(a==="hint")hint();else if(a==="next")nextQuestion();
  else if(a==="vaultCheck")checkVaultAnswer();else if(a==="vaultHint")vaultHint();else if(a==="vaultNext")nextVault();
});
welcome();
})();