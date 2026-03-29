"""
Test automatizado do parser processar_texto
Verifica extração correta de campos da ficha de escola i-Educar
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import processar_texto

# ─── Texto simulado de ficha i-Educar ─────────────────────────
TEXTO_ESCOLA = """
Código INEP *
12345678
CNPJ
01.234.567/0001-89
Escola *
EMEF Professor João da Silva
Sigla
EMEF PJS
Instituição
Prefeitura Municipal de Exemplo
Rede Ensino
Municipal
Zona Localização
Urbana
Localização Diferenciada
Não se aplica
CEP
Somente números
12345-000
Endereço
Rua das Flores
Número
123
Complemento
Bloco A
Bairro
Centro
Município
Exemplo City
Distrito
Sede
(DDD) / Telefone 1
11
98765-4321
(DDD) / Telefone 2
11
91234-5678
(DDD) / Celular
11
99999-8888
E-mail *
escola@exemplo.com.br
Site / Blog / Rede Social
www.escola.exemplo.com.br
Situação de Funcionamento
Em atividade
Dependência Administrativa
Municipal
Regulamentação / Conselho de Educação
Sim
Ato de Criação
Lei Municipal nº 1234/2010
Ato Autorizativo
Portaria nº 567/2011
Secretário Escolar
Maria Souza
Carlos Alberto Pereira
Diretor(a)
"""

def run_tests():
    resultado = processar_texto(TEXTO_ESCOLA)
    
    # Campos esperados
    esperado = {
        'codigo_inep': '12345678',
        'cnpj': '01.234.567/0001-89',
        'nome_escola': 'EMEF Professor João da Silva',
        'sigla': 'EMEF PJS',
        'instituicao': 'Prefeitura Municipal de Exemplo',
        'rede_ensino': 'Municipal',
        'zona_localizacao': 'Urbana',
        'localizacao_diferenciada': 'Não se aplica',
        'cep': '12345-000',
        'endereco': 'Rua das Flores',
        'numero': '123',
        'complemento': 'Bloco A',
        'bairro': 'Centro',
        'municipio': 'Exemplo City',
        'distrito': 'Sede',
        'telefone1': '(11) 98765-4321',
        'telefone2': '(11) 91234-5678',
        'celular': '(11) 99999-8888',
        'email': 'escola@exemplo.com.br',
        'site': 'www.escola.exemplo.com.br',
        'situacao_funcionamento': 'Em atividade',
        'dependencia_adm': 'Municipal',
        'regulamentacao': 'Sim',
        'ato_criacao': 'Lei Municipal nº 1234/2010',
        'ato_autorizativo': 'Portaria nº 567/2011',
        'secretario_escolar': 'Maria Souza',
        'diretor': 'Carlos Alberto Pereira',
    }

    total = 0
    passed = 0
    failed = 0

    for campo, valor_esperado in esperado.items():
        total += 1
        valor_obtido = resultado.get(campo)
        if valor_obtido == valor_esperado:
            passed += 1
            print(f"  ✅ {campo}: '{valor_obtido}'")
        else:
            failed += 1
            print(f"  ❌ {campo}: esperado='{valor_esperado}' | obtido='{valor_obtido}'")

    # Verificar que não há campos extras inesperados
    extras = set(resultado.keys()) - set(esperado.keys())
    if extras:
        print(f"\n  ⚠️  Campos extras no resultado: {extras}")

    print(f"\n{'='*50}")
    print(f"  TOTAL: {total} | ✅ {passed} | ❌ {failed}")
    print(f"{'='*50}")

    # Teste de texto vazio
    vazio = processar_texto("")
    assert vazio == {}, f"Texto vazio deveria retornar dict vazio, retornou: {vazio}"
    print("  ✅ Texto vazio retorna {} corretamente")

    # Teste de texto sem labels
    sem_labels = processar_texto("Apenas um texto qualquer\nSem nenhum label conhecido")
    assert sem_labels == {}, f"Texto sem labels deveria retornar dict vazio, retornou: {sem_labels}"
    print("  ✅ Texto sem labels retorna {} corretamente")

    return failed == 0

if __name__ == "__main__":
    print("=" * 50)
    print("  TESTES DO PARSER - Extrator de Escolas")
    print("=" * 50)
    success = run_tests()
    sys.exit(0 if success else 1)
