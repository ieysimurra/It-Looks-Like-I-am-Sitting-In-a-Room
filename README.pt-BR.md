# It Looks Like I Am Sitting in a Room

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![p5.js](https://img.shields.io/badge/p5.js-v1.9.0-ED225D.svg)](https://p5js.org/)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Enabled-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> Uma reimaginação interativa baseada na web da obra seminal de arte sonora de Alvin Lucier "I Am Sitting in a Room" (1969)

🌐 **[Read in English](README.md)**

![Preview da Interface](assets/screenshots/interface-preview.png)

## 🎵 Sobre o Projeto

**It Looks Like I Am Sitting in a Room** é uma implementação digital interativa da composição eletroacústica revolucionária de Alvin Lucier. A aplicação permite que os usuários experimentem a transformação gradual da fala inteligível para a pura ressonância acústica através de um processo iterativo de feedback—tudo dentro de um navegador web.

### A Obra Original

> *"Estou sentado em uma sala diferente daquela em que você está agora. Estou gravando o som da minha voz falada e vou reproduzi-la na sala repetidamente até que as frequências ressonantes da sala se reforcem de tal modo que qualquer semelhança com minha fala, com talvez a exceção do ritmo, seja destruída."*
> 
> — Alvin Lucier, 1969

**Alvin Lucier** (1931–2021) foi um compositor experimental e artista sonoro americano que explorou fenômenos psicoacústicos e as propriedades físicas do som. "I Am Sitting in a Room" permanece como uma das obras mais influentes na história da arte sonora, demonstrando como o próprio espaço pode se tornar um instrumento.

## ✨ Funcionalidades

### Funcionalidade Principal
- 🎤 **Gravação de Voz** com reconhecimento de fala em tempo real
- 🔄 **Processamento Iterativo** simulando feedback acústico de sala
- 🔊 **Modo Tempo Real** para manipulação de efeitos ao vivo
- 🔁 **Reprodução em Loop** de todas as iterações processadas
- 🎲 **Processamento Aleatório** com parâmetros randomizados
- 📊 **Análise Espectral** com display de frequência logarítmica

### Processamento de Áudio
- 🏠 **Presets de Sala Virtual** (Sala Pequena, Grande Hall, Banheiro, Escadaria, Catedral)
- 🎚️ **Parâmetros Ajustáveis**: Filter Q, Dry/Wet Mix, Feedback Gain
- 🔉 **Reverb de Convolução** com respostas ao impulso sintéticas
- 📈 **Normalização Dinâmica** com compressão soft-knee
- 🎵 **Fade In/Out** para transições suaves

### Visualização
- 📉 **Analisador de Espectro em Tempo Real** (escala logarítmica)
- 🎯 **Marcadores de Ressonância da Sala**
- 📊 **Detecção de Fase** (Fala → Híbrida → Modal)
- 📈 **Gráfico de Convergência** mostrando transformação H(f)ⁿ
- 🔬 **Métricas Espectrais** (Centroide, Flatness, Peak Ratio, Bandwidth)

### Opções de Exportação
- 💾 **Exportação WAV** (iterações individuais)
- 📦 **Arquivo ZIP** (todas as iterações)
- 🎬 **Exportação de Sequência** (áudio concatenado)
- 🖼️ **Screenshot PNG** da visualização

## 🚀 Demo ao Vivo

**[▶️ Experimente no p5.js Web Editor](https://editor.p5js.org/ieysimurra/full/X_q8QkuEx)**

Ou execute localmente abrindo `index.html` em um navegador web moderno.

## 📁 Estrutura do Repositório

```
It-Looks-Like-I-Am-Sitting-in-a-Room/
├── index.html              # Arquivo HTML principal
├── sketch.js               # Aplicação p5.js principal (~3000 linhas)
├── style.css               # Estilização e UI
├── README.md               # Documentação (Inglês)
├── README.pt-BR.md         # Documentação (Português)
├── LICENSE                 # Licença MIT
├── assets/
│   └── screenshots/        # Screenshots da interface
└── docs/
    ├── TECHNICAL.md        # Documentação técnica
    ├── TUTORIAL.md         # Tutorial do usuário
    └── COMPOSITIONAL.md    # Conceitos composicionais
```

## 🎮 Início Rápido

### Usando o p5.js Web Editor (Recomendado)

1. Acesse o [p5.js Web Editor](https://editor.p5js.org/)
2. Crie um novo projeto
3. Copie o conteúdo de `sketch.js` para o arquivo sketch
4. Copie o conteúdo de `style.css` para um novo arquivo `style.css`
5. Atualize `index.html` para incluir o link do CSS
6. Clique em **Play** ▶️

### Executando Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/ieysimurra/It-Looks-Like-I-Am-Sitting-in-a-Room.git
   ```

2. Abra `index.html` em um navegador web moderno (Chrome, Firefox, Edge recomendados)

3. Permita o acesso ao microfone quando solicitado

## 📖 Como Usar

### Fluxo de Trabalho Básico

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  1. GRAVAR  │ -> │ 2. PROCESSAR│ -> │  3. OUVIR   │ -> │  4. REPETIR │
│    (Voz)    │    │  (Iteração) │    │   (Play)    │    │   (2→3→2)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Passo a Passo

1. **Grave Sua Voz**: Clique em "🎤 Start Recording" e fale claramente
2. **Processe a Iteração**: Clique em "🔄 Process Iteration" para aplicar as ressonâncias da sala
3. **Ouça**: Clique em "▶ Play Current" para ouvir a versão processada
4. **Repita**: Processe mais iterações (5-12 recomendadas) para ouvir a transformação
5. **Compare**: Use "📊 Compare Spectra" para visualizar a evolução espectral

### Modo Tempo Real

1. Grave algo primeiro
2. Clique em "🔴 Real-time Mode" ou pressione `E`
3. Ajuste os sliders e ouça as mudanças instantaneamente
4. Perfeito para explorar ressonâncias e encontrar configurações ideais

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `Espaço` | Play/Stop (também para loop e modo tempo real) |
| `R` | Iniciar/Parar gravação |
| `I` | Processar próxima iteração |
| `L` | Alternar reprodução em loop |
| `E` | Alternar modo tempo real |
| `X` | Iniciar/Parar processamento aleatório |
| `T` | Mostrar/Esconder painel de transcrição |
| `H` | Mostrar/Esconder painel de controle |
| `← →` | Navegar entre iterações |

## 🎚️ Parâmetros de Efeito

| Parâmetro | Faixa | Descrição |
|-----------|-------|-----------|
| **Filter Q** | 5-100 | Nitidez da ressonância (maior = mais dramático) |
| **Dry/Wet** | 0-100% | Balanço entre sinal original e processado |
| **Feedback** | 50-100% | Ganho geral aplicado ao sinal processado |
| **Convolution** | On/Off | Adiciona reverb realista de sala |

### Presets de Sala

| Preset | Frequências | Característica |
|--------|-------------|----------------|
| **Small Room** | 120-2400 Hz | Ressonâncias brilhantes e estreitas |
| **Large Hall** | 60-1400 Hz | Ressonâncias profundas e espaçadas |
| **Bathroom** | 200-4000 Hz | Reflexões fortes em médias frequências |
| **Stairwell** | 80-1920 Hz | Espaçamento harmônico |
| **Cathedral** | 40-1200 Hz | Muito graves, tipo drone |

## 🔬 As Três Fases da Transformação

O processo de transformação segue três fases distintas, conforme descrito por Lucier:

### 🔊 Fase de Fala
- Conteúdo semântico é claro
- Formantes da voz visíveis no espectro
- Alta largura de banda espectral

### 🔀 Fase Híbrida
- Inteligibilidade decai
- Modos da sala ganham sustentação
- Ritmo prosódico persiste como padrões "fantasma"

### 🎵 Fase Modal
- Fala desaparece completamente
- Campos harmônicos quase-senoidais
- "A sala tocando a si mesma"

## 🧮 A Matemática

Se a sala tem resposta em frequência **H(f)** e sua primeira gravação tem espectro **X(f)**, então após **n** iterações o resultado tende a:

```
Resultado(f) = H(f)ⁿ · X(f)
```

Como |H(f)| > 1 nos picos ressonantes, esses picos dominam exponencialmente—é por isso que eventualmente ouvimos tons puros em vez de fala.

## 🎭 Conceitos Composicionais

Esta obra exemplifica conceitos-chave na composição contemporânea e arte sonora:

- **Processo como Forma**: Não há tema a desenvolver; ouvimos um processo operando
- **Espaço como Instrumento**: Conteúdo musical se transfere do texto para a arquitetura
- **Emergência**: Resultado final emerge das propriedades do sistema, não do controle direto
- **Poética**: A frase sobre "suavizar irregularidades" (Lucier tinha gagueira) liga corpo e espaço

## 🛠️ Detalhes Técnicos

### Tecnologias Utilizadas
- **p5.js** - Framework de programação criativa
- **p5.sound** - Biblioteca de áudio com análise FFT
- **Web Audio API** - Processamento de áudio em tempo real
- **Web Speech API** - Reconhecimento de fala
- **MediaRecorder API** - Gravação de áudio

### Pipeline de Processamento de Áudio

```
Entrada → [Filtros Peaking (8x)] → [LPF Absorção do Ar] → [Convolver (opcional)]
                                                                ↓
Saída ← [Limiter] ← [Ganho Master] ← [Mix Dry/Wet] ←───────────┘
```

### Compatibilidade de Navegadores

| Navegador | Suporte |
|-----------|---------|
| Chrome | ✅ Suporte completo |
| Firefox | ✅ Suporte completo |
| Edge | ✅ Suporte completo |
| Safari | ⚠️ Limitado (sem reconhecimento de fala) |

## 📚 Referências

### Obra Original
- Lucier, A. (1969). *I Am Sitting in a Room*. Lovely Music.
- [Wikipedia: I Am Sitting in a Room](https://en.wikipedia.org/wiki/I_Am_Sitting_in_a_Room)
- [Gravação Original (YouTube)](https://www.youtube.com/watch?v=fAxHlLK3Oyk)

### Sobre Alvin Lucier
- [Wikipedia: Alvin Lucier](https://en.wikipedia.org/wiki/Alvin_Lucier)
- Lucier, A. (2012). *Music 109: Notes on Experimental Music*. Wesleyan University Press.

### Recursos Técnicos
- [Documentação Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Referência p5.js](https://p5js.org/reference/)
- [Biblioteca p5.sound](https://p5js.org/reference/#/libraries/p5.sound)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para enviar um Pull Request.

1. Faça um Fork do repositório
2. Crie sua branch de feature (`git checkout -b feature/RecursoIncrivel`)
3. Commit suas mudanças (`git commit -m 'Adiciona RecursoIncrivel'`)
4. Push para a branch (`git push origin feature/RecursoIncrivel`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👤 Autor

**Ivan Googhoian Simurra**

- GitHub: [@ieysimurra](https://github.com/ieysimurra)
- Instituição: NICS/UNICAMP (Núcleo Interdisciplinar de Comunicação Sonora)

## 🙏 Agradecimentos

- **Alvin Lucier** (1931–2021) por criar esta obra revolucionária
- A comunidade **p5.js** pelas excelentes ferramentas de programação criativa
- **NICS/UNICAMP** por apoiar a pesquisa em musicologia computacional

---

## 🔗 Projetos Relacionados

Confira outras implementações interativas de obras de música experimental:

- [It Looks Like Mouse Music](https://github.com/ieysimurra/It-Looks-Like-Mouse-Music) - Laurie Spiegel
- [It Looks Like Artikulation](https://github.com/ieysimurra/It-Looks-Like-Artikulation) - György Ligeti
- [It Looks Like On December](https://github.com/ieysimurra/It-Looks-Like-On-December) - Earle Brown
- [It Looks Like Pendulum Music](https://github.com/ieysimurra/It-Looks-Like-Pendulum-Music) - Steve Reich

---

<p align="center">
  <i>"Eu considero esta atividade não tanto como uma demonstração de um fato físico, mas mais como uma maneira de suavizar quaisquer irregularidades que minha fala possa ter."</i>
  <br>
  — Alvin Lucier
</p>
