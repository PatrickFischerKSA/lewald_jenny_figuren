function norm(t){
  return t.toLowerCase().replace(/[^a-zäöüß ]/g,"");
}

document.querySelectorAll(".task").forEach(task=>{
  let attempts=0;
  const btn=task.querySelector(".submit");
  const feedback=task.querySelector(".feedback");
  const solution=task.querySelector(".solution");

  btn.addEventListener("click",()=>{
    attempts++;
    const type=task.dataset.type;

    if(type==="mc"){
      const c=task.dataset.correct;
      const sel=task.querySelector("input:checked");
      if(!sel){feedback.textContent="Bitte auswählen.";return;}
      if(sel.value===c){
        feedback.textContent="Richtig ✔";
        feedback.style.color="#6f6";
      }else if(attempts===1){
        feedback.textContent="Falsch.";
        feedback.style.color="#f66";
      }else if(attempts===2){
        feedback.textContent="Tipp: Achte auf Situation, Rolle und Machtverhältnis.";
        feedback.style.color="#fd6";
      }else{
        feedback.textContent="Musterlösung:";
        solution.classList.remove("hidden");
      }
    }

    if(type==="text"){
      const txt=task.querySelector("textarea").value;
      const keys=task.dataset.keywords.split(",");
      const hits=keys.filter(k=>norm(txt).includes(norm(k))).length;

      if(hits>=2){
        feedback.textContent="Textnah und differenziert ✔";
        feedback.style.color="#6f6";
      }else if(attempts===1){
        feedback.textContent="Zu allgemein oder ohne ausreichenden Textbezug.";
        feedback.style.color="#f66";
      }else if(attempts===2){
        feedback.textContent="Tipp: Beziehe dich explizit auf beschriebene Situationen.";
        feedback.style.color="#fd6";
      }else{
        feedback.textContent="Musterlösung:";
        solution.textContent=task.dataset.solution;
        solution.classList.remove("hidden");
      }
    }
  });
});
