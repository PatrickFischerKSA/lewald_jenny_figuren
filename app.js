function norm(t){
  return t.toLowerCase().replace(/[^a-zäöüß ]/g,"");
}

document.querySelectorAll(".task").forEach(task=>{
  let attempts = 0;
  const btn = task.querySelector(".submit");
  const feedback = task.querySelector(".feedback");
  const solution = task.querySelector(".solution");

  btn.addEventListener("click", ()=>{
    attempts++;
    const type = task.dataset.type;

    if(type==="mc"){
      const correct = task.dataset.correct;
      const checked = task.querySelector("input[type=radio]:checked");
      if(!checked){
        feedback.textContent="Bitte wähle eine Antwort.";
        return;
      }
      if(checked.value===correct){
        feedback.textContent="Richtig ✔";
        feedback.style.color="#6f6";
      }else if(attempts===1){
        feedback.textContent="Falsch ✖";
        feedback.style.color="#f66";
      }else if(attempts===2){
        feedback.textContent="Tipp: Achte auf gesellschaftliche Rahmenbedingungen.";
        feedback.style.color="#fd6";
      }else{
        feedback.textContent="Musterlösung:";
        solution.classList.remove("hidden");
      }
    }

    if(type==="text"){
      const txt = task.querySelector("textarea").value;
      const keys = task.dataset.keywords.split(",");
      const hit = keys.some(k=>norm(txt).includes(norm(k)));

      if(hit){
        feedback.textContent="Antwort sinnvoll ✔";
        feedback.style.color="#6f6";
      }else if(attempts===1){
        feedback.textContent="Noch nicht überzeugend.";
        feedback.style.color="#f66";
      }else if(attempts===2){
        feedback.textContent="Tipp: Nutze zentrale Begriffe aus dem Text.";
        feedback.style.color="#fd6";
      }else{
        feedback.textContent="Musterlösung:";
        solution.textContent = task.dataset.solution;
        solution.classList.remove("hidden");
      }
    }
  });
});
