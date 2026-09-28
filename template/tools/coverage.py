"""Checagem de cobertura linha a linha: toda linha do PDF precisa existir nos arquivos de dados.

Uso:  python -X utf8 tools/coverage.py "material.pdf" src/data/c*.js src/data/cases.js
      python -X utf8 tools/coverage.py "simulado.pdf" src/data/simulado.js

Normaliza os dois lados (tags HTML, aspas escapadas, espaços, caixa) e procura cada linha do PDF
com 6+ caracteres. Cabeçalhos e rodapés que se repetem em 3+ páginas são ignorados
sozinhos. Ausências esperadas: títulos numerados ("3.1 Título" vira num + title),
rótulos que a interface monta ("Questão 1 (1,0 ponto)"). Qualquer outra ausência é texto perdido
ou alterado: corrija antes de compilar. Linha quebrada com hífen no PDF ("megawatts-\\nhora")
também aparece; confira e siga.
Requer: pip install pymupdf
"""
import glob
import io
import re
import sys

import pymupdf


def norm(s):
    s = s.replace('\\"', '"')
    s = re.sub(r"<[^>]+>", " ", s)
    s = s.replace("•", " ")
    s = re.sub(r"_{3,}", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()


pdf, patterns = sys.argv[1], sys.argv[2:]
files = [f for p in patterns for f in glob.glob(p)]
data = " ".join(io.open(f, encoding="utf-8-sig").read() for f in files)
data = re.sub(r'"\s*\+\s*\n?\s*"', "", data)   # junta strings JS concatenadas
D = norm(data)

doc = pymupdf.open(pdf)
pages = [[norm(l) for l in p.get_text().split("\n")] for p in doc]

# cabeçalhos e rodapés corridos: a mesma linha (ignorando números) em 3 ou mais páginas
seen = {}
for i, pg in enumerate(pages):
    for l in set(pg):
        seen.setdefault(re.sub(r"\d+", "#", l), set()).add(i)
running = {k for k, v in seen.items() if len(v) >= 3 and len(k) >= 6}

lines = [l for pg in pages for l in pg if len(l) >= 6 and re.sub(r"\d+", "#", l) not in running]
miss = [l for l in lines if l.strip(" -") not in D]
# sem a numeração do começo ("3.1 ", "12. "), que no app fica em campo separado
real = [m for m in miss if re.sub(r"^\d+(\.\d+)*\.?\s+", "", m).strip() not in D]

print("arquivos:", len(files), "· linhas do PDF:", len(lines), "· ausentes:", len(real))
for m in real:
    print("  AUSENTE:", m)
