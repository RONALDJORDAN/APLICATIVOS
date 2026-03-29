"""
Fase 1 - Extrator Local de Dados de Escolas (i-Educar)
Flask + SQLite + Parser Label/Valor
Codaureo © 2026
"""

import sqlite3
import re
import os
from datetime import datetime
from io import BytesIO

from flask import Flask, render_template, request, jsonify, send_file
import openpyxl

# ─── Configuração ──────────────────────────────────────────────
app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "escolas.db")


# ─── Banco de Dados ───────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS escolas (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_inep             TEXT,
            cnpj                    TEXT,
            nome_escola             TEXT,
            sigla                   TEXT,
            instituicao             TEXT,
            rede_ensino             TEXT,
            zona_localizacao        TEXT,
            localizacao_diferenciada TEXT,
            cep                     TEXT,
            endereco                TEXT,
            numero                  TEXT,
            complemento             TEXT,
            bairro                  TEXT,
            municipio               TEXT,
            distrito                TEXT,
            telefone1               TEXT,
            telefone2               TEXT,
            celular                 TEXT,
            email                   TEXT,
            site                    TEXT,
            situacao_funcionamento  TEXT,
            dependencia_adm         TEXT,
            regulamentacao          TEXT,
            ato_criacao             TEXT,
            ato_autorizativo        TEXT,
            secretario_escolar      TEXT,
            diretor                 TEXT,
            texto_original          TEXT,
            data_extracao           TEXT
        )
    """)
    conn.commit()
    conn.close()


# ─── Mapeamento de Labels → Colunas ──────────────────────────
# Cada chave é um padrão (case-insensitive) que pode aparecer como label
# no texto colado. O valor é o nome da coluna no banco.
LABEL_MAP = {
    r'c[oó]digo\s*inep':              'codigo_inep',
    r'^cnpj(?!\s*polo)':              'cnpj',
    r'^escola\s*[\*:]?\s*$':           'nome_escola',
    r'^sigla\b':                      'sigla',
    r'^institui[cç][aã]o':            'instituicao',
    r'^rede\s*ensino':                'rede_ensino',
    r'^zona\s*localiza[cç][aã]o':     'zona_localizacao',
    r'localiza[cç][aã]o\s*diferenciada': 'localizacao_diferenciada',
    r'^cep\b':                        'cep',
    r'^endere[cç]o\b':                'endereco',
    r'^n[uú]mero\b':                  'numero',
    r'^complemento\b':                'complemento',
    r'^bairro\b':                     'bairro',
    r'^munic[ií]pio\b':               'municipio',
    r'^distrito':                     'distrito',
    r'telefone\s*1':                  'telefone1',
    r'telefone\s*2':                  'telefone2',
    r'celular':                       'celular',
    r'^e-?mail\b':                    'email',
    r'^site|blog|rede\s*social':      'site',
    r'situa[cç][aã]o\s*de\s*funcionamento': 'situacao_funcionamento',
    r'depend[eê]ncia\s*administrativa': 'dependencia_adm',
    r'regulamenta[cç][aã]o.*conselho': 'regulamentacao',
    r'^ato\s*de\s*cria[cç][aã]o':     'ato_criacao',
    r'^ato\s*autorizativo':           'ato_autorizativo',
    r'secret[aá]rio\s*escolar':       'secretario_escolar',
}

# Linhas que devem ser ignoradas (hints de formulário, cabeçalhos, etc.)
SKIP_PATTERNS = [
    r'^somente\s*n[uú]meros',
    r'^nnnnn',
    r'^nn\.nnn',
    r'^preencher\s*automaticamente',
    r'^n[aã]o\s*sei\s*meu\s*cep',
    r'^digite\s*um\s*cep',
    r'^s[aã]o\s*aceito\s*somente',
    r'^se\s*marcado',
    r'^selecione',
    r'^ddd$',
    r'^fax$',
    r'^latitude$',
    r'^longitude$',
    r'^\s*$',
]

# Labels compostos de DDD+Telefone: precisamos juntar as linhas
DDD_LABELS = [r'\(ddd\)\s*/\s*telefone\s*1', r'\(ddd\)\s*/\s*telefone\s*2', r'\(ddd\)\s*/\s*celular', r'\(ddd\)\s*/\s*fax']


def should_skip(line):
    """Verifica se uma linha é um hint/placeholder que deve ser ignorado."""
    clean = line.strip().lower()
    if not clean:
        return True
    for p in SKIP_PATTERNS:
        if re.search(p, clean, re.IGNORECASE):
            return True
    return False


def match_label(line):
    """
    Verifica se uma linha é um label conhecido.
    Labels terminam com * ou : no texto original.
    Retorna o nome da coluna correspondente ou None.
    """
    clean = line.strip()
    # Remove * e : do final para tentar casar com o mapa
    clean_label = re.sub(r'[\*\:\s]+$', '', clean).strip()

    for pattern, column in LABEL_MAP.items():
        if re.search(pattern, clean_label, re.IGNORECASE):
            return column
    return None


def match_ddd_label(line):
    """Verifica se a linha é um label de DDD/Telefone composto."""
    clean = line.strip().lower()
    for i, pattern in enumerate(DDD_LABELS):
        if re.search(pattern, clean, re.IGNORECASE):
            return ['telefone1', 'telefone2', 'celular', 'fax'][i]
    return None


def processar_texto(texto_bruto):
    """
    Parser principal: percorre as linhas do texto colado,
    identifica labels (terminados em * ou :) e captura
    os valores nas linhas seguintes.
    """
    linhas = texto_bruto.splitlines()
    resultado = {}
    i = 0

    while i < len(linhas):
        linha = linhas[i].strip()

        # Pular linhas vazias ou hints
        if should_skip(linha):
            i += 1
            continue

        # Verificar label de DDD composto (ex: "(DDD) / Telefone 1")
        ddd_col = match_ddd_label(linha)
        if ddd_col:
            # Coleta o DDD e o número nas próximas linhas não-skip
            ddd_val = ""
            num_val = ""
            j = i + 1
            collected = 0
            while j < len(linhas) and collected < 2:
                val = linhas[j].strip()
                # Se encontrou outro label, parar de coletar
                if match_label(val) or match_ddd_label(val):
                    break
                if not should_skip(val):
                    if collected == 0:
                        ddd_val = val
                    else:
                        num_val = val
                    collected += 1
                j += 1

            if ddd_val and num_val and ddd_col != 'fax':
                resultado[ddd_col] = f"({ddd_val}) {num_val}"
            elif ddd_val and not num_val and ddd_col != 'fax':
                # Apenas DDD sem número separado — pode ser número completo
                resultado[ddd_col] = ddd_val
            i = j
            continue

        # Verificar label padrão
        col = match_label(linha)
        if col:
            # Pegar o valor: próxima linha que não seja skip
            j = i + 1
            valor = None
            while j < len(linhas):
                candidato = linhas[j].strip()
                if should_skip(candidato):
                    j += 1
                    continue
                # Se o candidato é outro label, então este campo está vazio
                if match_label(candidato) or match_ddd_label(candidato):
                    break
                valor = candidato
                break

            if valor is not None and col not in resultado:
                resultado[col] = valor
                i = j + 1  # Avança para DEPOIS do valor capturado
            else:
                i = j if j > i + 1 else i + 1  # Sem valor: avança para o próximo label
            continue

        # Verificar se a linha contém "Diretor(a)" para extrair gestor
        if re.search(r'diretor\(a\)', linha, re.IGNORECASE):
            # O nome do diretor geralmente está na linha anterior
            if i > 0:
                nome_diretor = linhas[i - 1].strip()
                if nome_diretor and not should_skip(nome_diretor):
                    resultado['diretor'] = nome_diretor
            i += 1
            continue

        i += 1

    return resultado


# ─── Rotas Flask ──────────────────────────────────────────────
COLUNAS = [
    'codigo_inep', 'cnpj', 'nome_escola', 'sigla', 'instituicao',
    'rede_ensino', 'zona_localizacao', 'localizacao_diferenciada',
    'cep', 'endereco', 'numero', 'complemento', 'bairro',
    'municipio', 'distrito', 'telefone1', 'telefone2', 'celular',
    'email', 'site', 'situacao_funcionamento', 'dependencia_adm',
    'regulamentacao', 'ato_criacao', 'ato_autorizativo',
    'secretario_escolar', 'diretor'
]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/extrair", methods=["POST"])
def extrair():
    dados_json = request.get_json()
    texto_bruto = dados_json.get("texto", "").strip()

    if not texto_bruto:
        return jsonify({"erro": "Nenhum texto fornecido."}), 400

    try:
        resultado = processar_texto(texto_bruto)
    except Exception as e:
        return jsonify({"erro": f"Erro ao processar texto: {str(e)}"}), 500

    if not resultado:
        return jsonify({"erro": "Nenhum dado reconhecido no texto. Verifique o formato."}), 400

    # Verificar duplicata por codigo_inep ou cnpj
    conn = get_db()
    registro_existente = None
    mensagem_extra = ""

    if resultado.get('codigo_inep'):
        registro_existente = conn.execute(
            "SELECT id FROM escolas WHERE codigo_inep = ?",
            (resultado['codigo_inep'],)
        ).fetchone()
    elif resultado.get('cnpj'):
        registro_existente = conn.execute(
            "SELECT id FROM escolas WHERE cnpj = ?",
            (resultado['cnpj'],)
        ).fetchone()

    valores = [resultado.get(c) for c in COLUNAS]
    valores.append(texto_bruto)
    valores.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    if registro_existente:
        # Atualizar registro existente
        set_clause = ", ".join([f"{c} = ?" for c in COLUNAS + ['texto_original', 'data_extracao']])
        conn.execute(
            f"UPDATE escolas SET {set_clause} WHERE id = ?",
            valores + [registro_existente['id']]
        )
        mensagem_extra = " (registro existente atualizado)"
    else:
        # Inserir novo registro
        placeholders = ", ".join(["?"] * len(valores))
        col_names = ", ".join(COLUNAS + ['texto_original', 'data_extracao'])
        conn.execute(f"INSERT INTO escolas ({col_names}) VALUES ({placeholders})", valores)

    conn.commit()
    conn.close()

    return jsonify({
        "mensagem": f"Dados extraídos e salvos com sucesso!{mensagem_extra}",
        "dados": resultado,
        "campos_encontrados": len([v for v in resultado.values() if v]),
        "total_campos": len(COLUNAS)
    })


@app.route("/dados", methods=["GET"])
def listar_dados():
    conn = get_db()
    rows = conn.execute("SELECT * FROM escolas ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route("/dados/<int:escola_id>", methods=["DELETE"])
def deletar(escola_id):
    conn = get_db()
    conn.execute("DELETE FROM escolas WHERE id = ?", (escola_id,))
    conn.commit()
    conn.close()
    return jsonify({"mensagem": f"Registro {escola_id} removido."})


@app.route("/exportar")
def exportar():
    conn = get_db()
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM escolas ORDER BY id").fetchall()
    conn.close()

    if not rows:
        return jsonify({"erro": "Nenhum dado para exportar."}), 404

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Escolas"

    # Criar cabeçalho (ignorando texto_original)
    colunas_banco = list(rows[0].keys())
    colunas_export = [c for c in colunas_banco if c != 'texto_original']
    ws.append(colunas_export)

    # Inserir dados
    for row in rows:
        dados_linha = [row[c] for c in colunas_export]
        ws.append(dados_linha)

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"escolas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )


# ─── Inicialização ────────────────────────────────────────────
def start_flask():
    app.run(debug=False, port=5000, use_reloader=False)

if __name__ == "__main__":
    init_db()
    print("=" * 50)
    print("  Extrator de Escolas - Codaureo (i-Educar)")
    print("  Inicializando Servidor Web e Interface Desktop...")
    print("=" * 50)
    
    import threading
    import webbrowser
    
    # Inicia o servidor Flask em uma Thread separada
    flask_thread = threading.Thread(target=start_flask, daemon=True)
    flask_thread.start()
    
    # Importa a interface e a roda na Thread principal (exigência do Tkinter)
    try:
        from brave_automation import App
        ui_app = App()
        
        # Agenda a abertura do navegador após 1.5s
        ui_app.after(1500, lambda: webbrowser.open("http://127.0.0.1:5000"))
        
        # Inicia a interface desktop
        ui_app.mainloop()
    except Exception as e:
        print(f"Erro ao inicializar a interface desktop: {e}")
        # Se a interface falhar, cai silenciosamente, 
        # o Flask daemon vai morrer porque a main thread acabou
