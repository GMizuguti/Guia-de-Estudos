# manual-de-estudo

Skill do Claude Code que transforma um PDF de matéria (apostila, guia de
revisão, slides) num aplicativo de estudo **offline** para Windows (Tauri +
WebView2), com o material transcrito na íntegra e ferramentas de estudo em cima:

- leitor completo, com marcadores, notas e progresso de leitura;
- **Treino** com resposta escrita, resposta-modelo e autoavaliação, e prova aleatória com relógio;
- **Mapa** de revisão com esquemas e procedimento de decisão clicável;
- **Simulado** do professor (PDF à parte) com relógio, gabarito comentado oculto até entregar e nota pelo critério da prova;
- fichas de repetição espaçada, questões de múltipla escolha, comparador e busca global;
- cartão "roteiro de hoje" a partir da data da prova.

Tudo o que o app acrescenta ao material aparece marcado como do app.

## Instalação

Clone dentro da pasta de skills do Claude Code:

```bash
git clone https://github.com/<usuario>/manual-de-estudo.git ~/.claude/skills/manual-de-estudo
```

No Windows, `~` é `C:\Users\<usuario>`. A skill aparece como `/manual-de-estudo`.

## Uso

No Claude Code, anexe o PDF e chame a skill:

```
@"C:\caminho\material.pdf"
/manual-de-estudo
```

Para acrescentar um simulado a um app já feito, anexe o PDF do simulado e peça
"adiciona esse simulado em outra aba".

## Requisitos

| Para | Precisa |
|---|---|
| extrair e conferir o PDF | Python 3 + `pip install pymupdf` (o `pdftotext` do Poppler é opcional) |
| ver o app no navegador | nada: `tools\serve.ps1` usa o PowerShell do Windows |
| gerar o `.exe` / `.msi` | Rust, MSVC Build Tools, WebView2 e `cargo install tauri-cli` |

## Estrutura

```
SKILL.md                      instruções que o Claude segue
references/
  esquema-de-dados.md         todos os arquivos de dados e os 12 tipos de bloco
  design-system.md            cor, tipografia, forma e armadilhas de layout
  exemplo-classificacao.md    exemplo trabalhado de uma prova "classifique e justifique"
template/                     o app, copiado para cada matéria nova
  src/                        HTML, CSS e JS sem etapa de build
    data/                     o conteúdo da matéria (é o que se reescreve)
    js/                       o motor genérico
    assets/                   fontes e ícones vendorizados, com LICENSES/
  src-tauri/                  casca Tauri 2
  tools/                      extract-pdf.py, coverage.py, serve.ps1, build.ps1, make-icons.ps1
```

## Licenças de terceiros

As fontes Geist, Geist Mono e Source Serif 4 (SIL OFL 1.1) e os ícones
Phosphor (MIT) estão em `template/src/assets/`, com os textos das licenças em
`template/src/assets/LICENSES/`.
