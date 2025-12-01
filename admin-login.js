document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const usuario = document.getElementById("username").value;
  const senha = document.getElementById("password").value;

  // Simples validação (futuramente podemos conectar com banco de dados)
  if (usuario === "admin" && senha === "fullfire123") {
    window.location.href = "admin.html"; // Redireciona para painel
  } else {
    document.getElementById("loginErro").style.display = "block";
  }
});