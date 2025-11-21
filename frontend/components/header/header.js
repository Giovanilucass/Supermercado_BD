fetch("/components/header/header.html")
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao carregar o header: ${response.statusText}`);
        }
        return response.text();
    })
    .then(data => {
        document.getElementById("header").innerHTML = data;
    })
    .catch(error => console.error("Erro ao carregar o header:", error));
