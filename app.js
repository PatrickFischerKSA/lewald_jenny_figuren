(() => {
  const STORAGE_KEY = "jenny_lernlandschaft_v1";

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const state = loadState();

  // ---------- Helpers ----------
  function nowISO(){
    return new Date().toISOString();
  }

  function normalize(s){
    return (s || "")
      .toLowerCase()
      .replace(/[\u00e4]/g, "ae")
      .replace(/[\u00f6]/g, "oe")
      .replace(/[\u00fc]/g, "ue")
      .replace(/[\u00df]/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function saveState(){
    state.updatedAt = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateProgress();
  }

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        return {
          version: "v1",
          createdAt: parsed.createdAt || nowISO(),
          updatedAt: parsed.updatedAt || nowISO(),
          attempts: parsed.attempts || {},
          answers: parsed.answers || {},
          done: parsed.done || {},
        };
      }
    }catch(e){}
    return {
      version: "v1",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      attempts: {},
      answers: {},
      done: {},
    };
  }

  function setFeedback(taskEl, kind, msg){
    const fb = $(".feedback", taskEl);
    fb.classList.remove("good","bad","warn");
    if(kind) fb.classList.add(kind);
    fb.textContent = msg;
  }

  function showSolution(taskEl, on=true){
    const sol = $(".solution", taskEl);
    if(!sol) return;
    sol.classList.toggle("hidden", !on);
  }

  function incAttempt(taskId){
    state.attempts[taskId] = (state.attempts[taskId] || 0) + 1;
    return state.attempts[taskId];
  }

  function markDone(taskId){
    state.done[taskId] = true;
  }

  // ---------- Task handlers ----------
  function handleCheck(taskEl){
    const taskId = taskEl.dataset.task;
    const type = taskEl.dataset.type;

    if(type === "mc"){
      const correct = taskEl.dataset.correct;
      const chosen = $$(`input[type="radio"][name="${taskId}"]`, taskEl).find(r => r.checked)?.value || "";
      state.answers[taskId] = chosen;
      const attempt = incAttempt(taskId);

      if(!chosen){
        setFeedback(taskEl, "warn", "Bitte wähle eine Option aus.");
        saveState();
        return;
      }

      if(chosen === correct){
        setFeedback(taskEl, "good", "Richtig ✅");
        markDone(taskId);
        showSolution(taskEl, false);
      }else{
        if(attempt === 1){
          setFeedback(taskEl, "bad", "Falsch ❌");
        }else if(attempt === 2){
          setFeedback(taskEl, "warn", "Noch nicht. Hinweis: Achte auf die Verwandtschafts-/Rollenbeziehung.");
        }else{
          setFeedback(taskEl, "bad", "3 Versuche: Musterlösung wird angezeigt.");
          showSolution(taskEl, true);
          markDone(taskId);
        }
      }

      saveState();
      return;
    }

    if(type === "match"){
      // expected mapping
      const expected = {
        eduard: "arzt",
        reinhard: "theologe",
        erlau: "maler",
        steinheim: "arzt"
      };

      const selections = {};
      $$("select[data-key]", taskEl).forEach(sel => {
        selections[sel.dataset.key] = sel.value;
      });
      state.answers[taskId] = selections;

      const attempt = incAttempt(taskId);

      // check completeness
      const incomplete = Object.values(selections).some(v => !v);
      if(incomplete){
        setFeedback(taskEl, "warn", "Bitte fülle alle Felder aus.");
        saveState();
        return;
      }

      const allCorrect = Object.keys(expected).every(k => selections[k] === expected[k]);

      if(allCorrect){
        setFeedback(taskEl, "good", "Richtig ✅");
        markDone(taskId);
        showSolution(taskEl, false);
      }else{
        if(attempt === 1){
          setFeedback(taskEl, "bad", "Nicht ganz ❌");
        }else if(attempt === 2){
          setFeedback(taskEl, "warn", "Hinweis: Wer ist Arzt? Wer ist Lehrer/Theologe? (Mehrfach gleich möglich.)");
        }else{
          setFeedback(taskEl, "bad", "3 Versuche: Musterlösung wird angezeigt.");
          showSolution(taskEl, true);
          markDone(taskId);
        }
      }

      saveState();
      return;
    }

    if(type === "short"){
      const keywords = (taskEl.dataset.keywords || "").split(",").map(s => normalize(s));
      const ta = $("textarea.input", taskEl);
      const text = ta.value || "";
      state.answers[taskId] = text;

      const attempt = incAttempt(taskId);

      const n = normalize(text);
      const hits = keywords.filter(k => k && n.includes(k)).length;

      // Heuristik: mindestens 2 passende Stichworte = ok
      const ok = hits >= 2 || (keywords.length <= 3 && hits >= 1);

      if(!n){
        setFeedback(taskEl, "warn", "Bitte schreibe deine Stichworte.");
        saveState();
        return;
      }

      if(ok){
        setFeedback(taskEl, "good", "Passt ✅ (Idee erkannt)");
        markDone(taskId);
        showSolution(taskEl, false);
      }else{
        if(attempt === 1){
          setFeedback(taskEl, "bad", "Noch zu ungenau ❌");
        }else if(attempt === 2){
          setFeedback(taskEl, "warn", "Hinweis: Nenne Ursachen wie Armut/keine Stelle/Unterrichten/Verantwortung/Mutter/Vergangenheit.");
        }else{
          setFeedback(taskEl, "bad", "3 Versuche: Musterlösung wird angezeigt.");
          showSolution(taskEl, true);
          markDone(taskId);
        }
      }

      saveState();
      return;
    }

    // default
  }

  function handleSave(taskEl){
    const taskId = taskEl.dataset.task;
    const type = taskEl.dataset.type;

    if(type === "open"){
      const ta = $("textarea.input", taskEl);
      const text = ta.value || "";
      state.answers[taskId] = text;
      if(normalize(text).length >= 10){
        markDone(taskId);
        setFeedback(taskEl, "good", "Gespeichert ✅");
      }else{
        setFeedback(taskEl, "warn", "Gespeichert, aber sehr kurz – ergänze noch.");
      }
      saveState();
      return;
    }

    if(type === "mc_open"){
      const chosen = $$(`input[type="radio"][name="${taskId}"]`, taskEl).find(r => r.checked)?.value || "";
      const ta = $("textarea.input", taskEl);
      const text = ta.value || "";
      state.answers[taskId] = { chosen, text };
      if(chosen && normalize(text).length >= 10){
        markDone(taskId);
        setFeedback(taskEl, "good", "Gespeichert ✅");
      }else{
        setFeedback(taskEl, "warn", "Bitte wähle eine Figur und begründe kurz.");
      }
      saveState();
      return;
    }
  }

  function handleReveal(taskEl){
    showSolution(taskEl, true);
  }

  // ---------- Restore UI from state ----------
  function restore(){
    $$(".task").forEach(taskEl => {
      const id = taskEl.dataset.task;
      const type = taskEl.dataset.type;
      const ans = state.answers[id];

      if(type === "mc"){
        if(ans){
          const r = $$(`input[type="radio"][name="${id}"]`, taskEl).find(x => x.value === ans);
          if(r) r.checked = true;
        }
      }

      if(type === "match"){
        if(ans && typeof ans === "object"){
          $$("select[data-key]", taskEl).forEach(sel => {
            const v = ans[sel.dataset.key];
            if(v) sel.value = v;
          });
        }
      }

      if(type === "short" || type === "open"){
        if(typeof ans === "string"){
          const ta = $("textarea.input", taskEl);
          if(ta) ta.value = ans;
        }
      }

      if(type === "mc_open"){
        if(ans && typeof ans === "object"){
          const chosen = ans.chosen || "";
          if(chosen){
            const r = $$(`input[type="radio"][name="${id}"]`, taskEl).find(x => x.value === chosen);
            if(r) r.checked = true;
          }
          const ta = $("textarea.input", taskEl);
          if(ta) ta.value = ans.text || "";
        }
      }

      // show done marker via feedback (subtle)
      if(state.done[id]){
        // don't force solution open
      }
    });

    updateProgress();
  }

  // ---------- Progress ----------
  function updateProgress(){
    const tasks = $$(".task").map(t => t.dataset.task);
    const total = tasks.length;
    const done = tasks.filter(id => !!state.done[id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const bar = $("#progressBar");
    const txt = $("#progressText");
    const det = $("#progressDetail");
    if(bar) bar.style.width = pct + "%";
    if(txt) txt.textContent = pct + "%";
    if(det) det.textContent = `${done}/${total} erledigt`;
  }

  // ---------- Export / Print / Reset ----------
  function download(filename, content, mime="application/json"){
    const blob = new Blob([content], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportJSON(){
    const payload = {
      meta: {
        title: "Jenny – Lernlandschaft Export",
        version: state.version,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt
      },
      data: state
    };
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    download(`jenny_lernlandschaft_${stamp}.json`, JSON.stringify(payload, null, 2));
  }

  function resetAll(){
    if(!confirm("Wirklich alles löschen? (Antworten & Fortschritt)")) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function printView(){
    window.print();
  }

  // ---------- Wire events ----------
  function wire(){
    $$(".task").forEach(taskEl => {
      $$("[data-action]", taskEl).forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.dataset.action;
          if(action === "check") handleCheck(taskEl);
          if(action === "save") handleSave(taskEl);
          if(action === "reveal") handleReveal(taskEl);
        });
      });

      // autosave for open fields (light)
      const ta = $("textarea.input", taskEl);
      if(ta){
        ta.addEventListener("input", () => {
          const id = taskEl.dataset.task;
          const type = taskEl.dataset.type;
          if(type === "short"){
            state.answers[id] = ta.value || "";
            saveState();
          }
          if(type === "open"){
            state.answers[id] = ta.value || "";
            saveState();
          }
          if(type === "mc_open"){
            const chosen = $$(`input[type="radio"][name="${id}"]`, taskEl).find(r => r.checked)?.value || "";
            state.answers[id] = { chosen, text: ta.value || "" };
            saveState();
          }
        });
      }

      // autosave for match selects
      $$("select[data-key]", taskEl).forEach(sel => {
        sel.addEventListener("change", () => {
          const id = taskEl.dataset.task;
          const selections = state.answers[id] && typeof state.answers[id] === "object" ? state.answers[id] : {};
          selections[sel.dataset.key] = sel.value;
          state.answers[id] = selections;
          saveState();
        });
      });

      // autosave for mc radios
      $$("input[type=radio]", taskEl).forEach(r => {
        r.addEventListener("change", () => {
          const id = taskEl.dataset.task;
          const type = taskEl.dataset.type;
          if(type === "mc"){
            state.answers[id] = r.value;
          }
          if(type === "mc_open"){
            const ta = $("textarea.input", taskEl);
            state.answers[id] = { chosen: r.value, text: ta?.value || "" };
          }
          saveState();
        });
      });
    });

    $("#btnExport")?.addEventListener("click", exportJSON);
    $("#btnReset")?.addEventListener("click", resetAll);
    $("#btnPrint")?.addEventListener("click", printView);
  }

  wire();
  restore();
})();