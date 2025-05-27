// --- Dark Mode ---
let darkmode = localStorage.getItem('darkmode');
const themeswitch = document.getElementById('themeswitch');

const enableDarkMode = () => {
    document.body.classList.add('darkmode');
    localStorage.setItem('darkmode', 'active');
}
const disableDarkMode = () => {
    document.body.classList.remove('darkmode');
    localStorage.setItem('darkmode', null);
}
if (darkmode === "active") {
    enableDarkMode();
}
themeswitch.addEventListener('click', () => {
    darkmode = localStorage.getItem('darkmode');
    darkmode!== "active" ? enableDarkMode() : disableDarkMode()
});

// --- Gráfico ---
const canvas = document.getElementById('meuGrafico');
const ctx = canvas.getContext('2d');
const inputFuncao = document.getElementById('funcao');
const inputXMin = document.getElementById('xMin');
const inputXMax = document.getElementById('xMax');
const inputYMin = document.getElementById('yMin');
const inputYMax = document.getElementById('yMax');
const botaoDesenhar = document.getElementById('desenharGrafico');
const mensagemErro = document.getElementById('mensagem');
const tipoFuncaoSelect = document.getElementById('tipoFuncao');

let grafico;

function compilarFuncao(funcaoStr) {
    try {
        return math.compile(funcaoStr);
    } catch (err) {
        mensagemErro.textContent = 'Erro ao compilar a função: ' + err.message;
        return null;
    }
}

function avaliarFuncao(compilada, x) {
    try {
        const y = compilada.evaluate({ x });
        return isFinite(y) ? y : NaN;
    } catch {
        return NaN;
    }
}

function validarFuncao(funcaoStr) {
    if (!funcaoStr.includes('x')) {
        mensagemErro.textContent = 'A função deve depender de x, como por exemplo: x^2 ou sin(x)';
        return false;
    }
    return true;
}

// Animação do gráfico desenhando
function animarGrafico(dadosSegmentos, xMin, xMax, yMin, yMax) {
    if (grafico) grafico.destroy();

    let pontosVisiveis = 2;
    const maxPontos = Math.max(...dadosSegmentos.map(seg => seg.length));

    function desenharFrame() {
        const datasets = dadosSegmentos.map((segmento, index) => ({
            label: `Segmento ${index + 1}`,
            data: segmento.slice(0, Math.min(segmento.length, pontosVisiveis)),
            borderColor: '#d95c2f',
            fill: false,
            pointRadius: 0,
            tension: 0.1
        }));

        grafico = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                animation: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: xMin,
                        max: xMax,
                        title: { display: true, text: 'x' }
                    },
                    y: {
                        type: 'linear',
                        min: yMin,
                        max: yMax,
                        title: { display: true, text: 'y' }
                    }
                },
                plugins: {
                    legend: { display: true },
                    annotation: {
                        annotations: {
                            linhaHorizontal: {
                                type: 'line',
                                yMin: 0, yMax: 0,
                                borderColor: 'rgba(0, 0, 0, 0.5)',
                                borderWidth: 1
                            },
                            linhaVertical: {
                                type: 'line',
                                xMin: 0, xMax: 0,
                                borderColor: 'rgba(0, 0, 0, 0.5)',
                                borderWidth: 1
                            }
                        }
                    }
                }
            }
        });

        pontosVisiveis += 8;

        if (pontosVisiveis <= maxPontos) {
            setTimeout(() => {
                grafico.destroy();
                desenharFrame();
            }, 12);
        }
    }

    desenharFrame();
}

function desenharGrafico() {
    const xMin = parseFloat(inputXMin.value);
    const xMax = parseFloat(inputXMax.value);
    const yMin = parseFloat(inputYMin.value);
    const yMax = parseFloat(inputYMax.value);
    const funcaoStr = inputFuncao.value.trim();

    mensagemErro.textContent = '';

    if ([xMin, xMax, yMin, yMax].some(isNaN)) {
        mensagemErro.textContent = 'Insira valores numéricos válidos para os limites.';
        return;
    }

    if (xMin >= xMax || yMin >= yMax) {
        mensagemErro.textContent = 'xMin deve ser menor que xMax e yMin menor que yMax.';
        return;
    }

    if (!validarFuncao(funcaoStr)) return;

    const funcaoCompilada = compilarFuncao(funcaoStr);
    if (!funcaoCompilada) return;

    const numPontos = 500;
    const passo = (xMax - xMin) / numPontos;
    const segmentos = [];
    let segmentoAtual = [];

    for (let i = 0; i <= numPontos; i++) {
        const x = xMin + i * passo;
        let y = avaliarFuncao(funcaoCompilada, x);

        // Tratar pontos inválidos (NaN, Infinity, -Infinity)
        if (!isFinite(y) || isNaN(y)) {
            if (segmentoAtual.length > 0) {
                segmentos.push(segmentoAtual);
                segmentoAtual = [];
            }
            continue; // Pula este ponto
        }

        // Para funções com saltos/descontinuidades, separa segmentos quando a variação de y for muito brusca
        if (segmentoAtual.length > 0) {
            const ultimoPonto = segmentoAtual[segmentoAtual.length - 1];
            // Se diferença muito grande, quebra o segmento
            if (Math.abs(y - ultimoPonto.y) > Math.abs(yMax - yMin) * 0.4) {
                segmentos.push(segmentoAtual);
                segmentoAtual = [];
            }
        }

        segmentoAtual.push({ x, y });
    }

    if (segmentoAtual.length > 0) {
        segmentos.push(segmentoAtual);
    }

    // Filtra segmentos muito curtos
    const segmentosFiltrados = segmentos.filter(seg => seg.length > 2);

    if (!segmentosFiltrados.length) {
        mensagemErro.textContent = 'Nenhum ponto válido para plotar. Verifique a função.';
        if (grafico) grafico.destroy();
        document.getElementById("infoFuncao").innerHTML = '';
        return;
    }

    animarGrafico(segmentosFiltrados, xMin, xMax, yMin, yMax);

    // ➡️ Mostra "Carregando..." enquanto espera explicação da IA
    document.getElementById("infoFuncao").innerHTML = "<b>Carregando explicação...</b>";
    generateExplanation(funcaoStr);
}

tipoFuncaoSelect.addEventListener('change', () => {
    const tipo = tipoFuncaoSelect.value;
    const exemplos = {
        'logaritmica': { func: 'log10(x)', xMin: 0.1, xMax: 10, yMin: -1, yMax: 2 },
        'exponencial': { func: 'exp(x)', xMin: -2, xMax: 5, yMin: -1, yMax: 150 },
        'polinomial': { func: 'x^2', xMin: -10, xMax: 10, yMin: -10, yMax: 100 },
        'Trigonométrica': { func: 'cos(x) + sin(x)', xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        'Composta': { func: 'sin(x^2)', xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        'linear': { func: 'x', xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        'Racional': { func: '1/x', xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    };

    const ex = exemplos[tipo] || exemplos['linear'];
    inputFuncao.value = ex.func;
    inputXMin.value = ex.xMin;
    inputXMax.value = ex.xMax;
    inputYMin.value = ex.yMin;
    inputYMax.value = ex.yMax;

    desenharGrafico();
});

if (!inputFuncao.value) {
    inputFuncao.value = 'x';
    inputXMin.value = '-15';
    inputXMax.value = '15';
    inputYMin.value = '-15';
    inputYMax.value = '15';
}

botaoDesenhar.addEventListener('click', desenharGrafico);
