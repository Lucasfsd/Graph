let context = "Máximo 600 caracteres. Formate o texto usando apenas <b> e <br> conforme necessário. Não use blocos de código, não escreva “html”, não coloque aspas ao redor da resposta. O conteúdo será inserido diretamente dentro de uma <p> no HTML. A explicação deve incluir a fórmula da função, seu comportamento (como crescimento, concavidade ou raiz), e analogias simples se possível. A função é: f(x) ="

async function generateExplanation(prompt) {
    try {
        const explanationElement = document.getElementById("infoFuncao"); // AJUSTADO para o id correto!
        explanationElement.style.display = "block";
        explanationElement.innerHTML = "<b>Carregando explicação...</b>";
        const result = await callGeminiAPI(context + prompt);
        if (result) {
            explanationElement.innerHTML = result;
        } else {
            explanationElement.innerHTML = "<b>Não foi possível obter explicação da IA.</b>";
        }
        return result;
    } catch (error) {
        console.error(error);
        document.getElementById("infoFuncao").innerHTML = "<b>Erro ao chamar a IA Gemini.</b>";
        return "Erro ao chamar a API Gemini.";
    }
}

async function callGeminiAPI(prompt) {
    const apiKey = 'AIzaSyA0MpQGcK8aOmtwxc72BdKwDzKgle5vqBE';
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

    const body = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error('API call failed: ' + response.statusText);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
