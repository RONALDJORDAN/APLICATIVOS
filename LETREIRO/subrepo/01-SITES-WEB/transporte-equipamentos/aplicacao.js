/* =========================================
   APLICAÇÃO PRESENCIAL LOGIC
========================================= */
let aplicacaoMaxAparelhos = 435;
let aplicacaoData = {};
let currentEditAplicacaoId = null;
let currentViewMode = 'escola'; // 'escola' or 'data'

const SEED_DATA = [
    // 05/03 (QUINTA-FEIRA) - ZONA URBANA
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º A", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º B", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º C", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º A", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º B", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º C", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "3º A", 30, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "3º B", 30, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "4º A", 35, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "4º B", 35, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "5º A", 35, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "5º B", 35, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "1º A", 19, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "2º A", 16, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "3º", 20, "Manhã", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º D", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º E", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "1º F", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º D", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º E", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "2º F", 20, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "3º C", 30, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "3º D", 30, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "4º C", 35, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "4º D", 35, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "5º C", 35, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO SENADOR RUI PALMEIRA", "Cidade", "5º D", 35, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "1º B", 19, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "2º B", 14, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "4º", 29, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],
    ["UNIDADE MUNICIPAL DE ENSINO RONALCO DOS ANJOS", "Cidade", "5º", 26, "Tarde", "2026-03-05", "Quinta-Feira", "Urbana"],

    // 06/03 (SEXTA-FEIRA) - ZONA URBANA/RURAL
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "6º A", 28, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "6º B", 27, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "6º C", 29, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "6º D", 29, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "6º E", 28, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "7º A", 31, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "7º B", 35, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "7º C", 31, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "8º A", 34, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "8º B", 35, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "9º A", 35, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "9º B", 31, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", "Ilha do Ferro", "1º", 3, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", "Ilha do Ferro", "2º", 8, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", "Ilha do Ferro", "3º", 7, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", "Ilha do Ferro", "4º", 6, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROF MANOEL ALVES", "Ilha do Ferro", "5º", 7, "Manhã", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "7º D", 35, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "8º C", 23, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "8º D", 25, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "8º E", 26, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "9º C", 28, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "9º D", 30, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO PROFª MARIA TAVARES PINTO", "Cidade", "9º E", 32, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNIC DE ENS PROFª Mª CELESTE M DE ANDRADE", "Poço do Sal", "1º A", 10, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNIC DE ENS PROFª Mª CELESTE M DE ANDRADE", "Poço do Sal", "1º B", 6, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNIC DE ENS PROFª Mª CELESTE M DE ANDRADE", "Poço do Sal", "2º", 14, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO JOSE TAVARES DE CASTRO", "Jacarezinho", "6º", 10, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO JOSE TAVARES DE CASTRO", "Jacarezinho", "7º", 17, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO JOSE TAVARES DE CASTRO", "Jacarezinho", "8º", 13, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO JOSE TAVARES DE CASTRO", "Jacarezinho", "9º", 11, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", "Limoeiro", "1º", 17, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", "Limoeiro", "2º", 13, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", "Limoeiro", "3º", 23, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", "Limoeiro", "4º", 9, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO LINDAURO COSTA", "Limoeiro", "5º", 14, "Tarde", "2026-03-06", "Sexta-Feira", "Urbana/Rural"],

    // 09/03 (SEGUNDA-FEIRA) - ZONA RURAL
    ["UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", "Rua Nova", "1º", 16, "Manhã", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", "Rua Nova", "4º", 7, "Manhã", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", "Xexéu", "1º", 14, "Manhã", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", "Xexéu", "2º", 9, "Manhã", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", "Rua Nova", "2º", 11, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", "Rua Nova", "3º", 8, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL VER ANTONIO MACHADO GUIMARAES", "Rua Nova", "5º", 15, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", "Xexéu", "3º", 14, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", "Xexéu", "4º", 12, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],
    ["UNIDADE MUNICIPAL ENS JULIO DAMASCENO RIBEIRO", "Xexéu", "5º", 9, "Tarde", "2026-03-09", "Segunda-Feira", "Rural"],

    // 10/03 (TERÇA-FEIRA) - ZONA RURAL
    ["UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", "Meirús", "2º", 15, "Manhã", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", "Meirús", "4º", 13, "Manhã", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENS JAIME DE ALTAVILLA", "Entrocamento", "6º A", 20, "Manhã", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENS JAIME DE ALTAVILLA", "Entrocamento", "6º B", 46, "Manhã", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENS JAIME DE ALTAVILLA", "Entrocamento", "6º C", 35, "Manhã", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", "Meirús", "1º", 11, "Tarde", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", "Meirús", "3º", 11, "Tarde", "2026-03-10", "Terça-Feira", "Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO ANA TEREZA DE JESUS", "Meirús", "5º", 14, "Tarde", "2026-03-10", "Terça-Feira", "Rural"],

    // OUTRAS ESCOLAS
    ["UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", "Garrincha", "1º", 20, "Manhã", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", "Garrincha", "2º", 22, "Manhã", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", "Garrincha", "3º", 16, "Manhã", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", "Garrincha", "4º", 21, "Tarde", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO SAO MIGUEL", "Garrincha", "5º", 16, "Tarde", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO CAMPO NOVO", "Campo Novo", "6º", 18, "Manhã", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO CAMPO NOVO", "Campo Novo", "7º", 23, "Manhã", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO CAMPO NOVO", "Campo Novo", "8º", 20, "Tarde", "2026-03-09", "Segunda-Feira", "Urbana/Rural"],
    ["UNIDADE MUNICIPAL DE ENSINO CAMPO NOVO", "Campo Novo", "9º", 27, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "1º", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "2º", 10, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "3º", 13, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "4º", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "5º", 13, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "6º", 18, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "7º", 37, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "8º", 36, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "UNIDADE MUNICIPAL DE ENSINO SITIO JOAO LEITE", "9º", 30, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "1º A", 13, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "1º B", 13, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "2º", 24, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "3º", 17, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "4º", 22, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "5º", 20, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "6º", 26, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "7º", 23, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "8º", 21, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO PEDRO SOARES DOS PRAZERES", "União", "9º", 21, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "1º A", 20, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "1º B", 21, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "2º A", 21, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "2º B", 22, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "3º A", 16, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "3º B", 17, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "4º A", 26, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "4º B", 26, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "5º A", 20, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO CAP MANOEL REGO", "Impoeira de Baixo", "5º B", 19, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "7º A", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "7º B", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "7º C", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "9º A", 12, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "9º B", 15, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "8º A", 15, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "8º B", 15, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "8º C", 14, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MINISTRO AUGUSTO DE FREITAS MACHADO", "Lagoa de Pedra", "9º C", 11, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "1º", 14, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "2º A", 12, "Manhã", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "2º B", 14, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "3º", 18, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "4º", 20, "Tarde", "", "", ""],
    ["UNIDADE MUNICIPAL DE ENSINO MONSENHOR LYRA", "Lagoa de Pedra", "5º", 23, "Tarde", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "1º", 6, "Manhã", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "2º", 9, "Manhã", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "3º", 23, "Manhã", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "4º", 17, "Manhã", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "5º", 20, "Tarde", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "6º", 34, "Tarde", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "7º", 20, "Tarde", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "8º", 22, "Tarde", "", "", ""],
    ["UNIDADE MUNIC DE ENS JOSE GONCALVES DE ANDRADE", "Machado", "9º", 15, "Tarde", "", "", ""]
];
function setupAplicacaoFirebase() {
    if (typeof database === 'undefined') return;

    const form = document.getElementById('form-aplicacao');
    if (form) form.addEventListener('submit', handleAddAplicacao);

    // Load max aparelhos config
    database.ref('configAplicacao/maxAparelhos').on('value', (snap) => {
        aplicacaoMaxAparelhos = snap.val() || 435;
        const el = document.getElementById('stat-aparelhos-max');
        if (el) el.textContent = aplicacaoMaxAparelhos;
        updateAplicacaoStats();
    });

    // Load data
    database.ref('aplicacoes').on('value', (snap) => {
        aplicacaoData = snap.val() || {};

        // If empty, seed data entirely
        if (Object.keys(aplicacaoData).length === 0) {
            seedAplicacaoData();
            return; // Will re-trigger on value
        }

        // SMART SYNC DISABLED: To avoid duplication during name migrations.
        // The user should use the "Resetar Dados" button to force a clean seed.
        /*
        const existingSchools = new Set(Object.values(aplicacaoData).map(e => e.escola));
        const missingRows = SEED_DATA.filter(row => !existingSchools.has(row[0]));
        ...
        */

        if (currentViewMode === 'escola') {
            renderAplicacaoAccordion();
        } else {
            renderAplicacaoByDate();
        }
        updateAplicacaoStats();
        populateEscolasDatalist();
    });
}

function seedAplicacaoData() {
    const updates = {};
    SEED_DATA.forEach((row, i) => {
        const key = 'seed_' + String(i).padStart(3, '0') + '_' + Date.now();
        updates[key] = {
            escola: row[0],
            localidade: row[1],
            turma: row[2],
            alunos: row[3],
            turno: row[4],
            data: row[5] || "",
            dia: row[6] || "",
            zona: row[7] || "",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
    });
    database.ref('aplicacoes').set(updates);
}

function updateAplicacaoStats() {
    if (!aplicacaoData || Object.keys(aplicacaoData).length === 0) return;

    const entries = Object.values(aplicacaoData);
    const escolas = new Set(entries.map(e => e.escola));
    const totalTurmas = entries.length;
    const totalAlunos = entries.reduce((s, e) => s + (parseInt(e.alunos) || 0), 0);

    const elEscolas = document.getElementById('stat-escolas');
    const elTurmas = document.getElementById('stat-turmas');
    const elAlunos = document.getElementById('stat-alunos');
    const elAparelhosMax = document.getElementById('stat-aparelhos-max');
    const elProgressLabel = document.getElementById('progress-label');
    const elProgressFill = document.getElementById('progress-fill');

    if (elEscolas) elEscolas.textContent = escolas.size;
    if (elTurmas) elTurmas.textContent = totalTurmas;
    if (elAlunos) elAlunos.textContent = totalAlunos;
    if (elAparelhosMax) elAparelhosMax.textContent = aplicacaoMaxAparelhos;

    // Peak Demand Calculation (Highest shift in a single day)
    // Devices are reused daily, so we care about the largest group at once.
    const demandByDayAndTurn = {};
    entries.forEach(e => {
        if (!e.data) return; // Skip items without date for peak calculation
        const dayKey = e.data;
        if (!demandByDayAndTurn[dayKey]) demandByDayAndTurn[dayKey] = { "Manhã": 0, "Tarde": 0 };
        if (e.turno === "Manhã") demandByDayAndTurn[dayKey]["Manhã"] += (parseInt(e.alunos) || 0);
        if (e.turno === "Tarde") demandByDayAndTurn[dayKey]["Tarde"] += (parseInt(e.alunos) || 0);
    });

    let maxDemand = 0;
    Object.values(demandByDayAndTurn).forEach(day => {
        const dayMax = Math.max(day["Manhã"], day["Tarde"]);
        if (dayMax > maxDemand) maxDemand = dayMax;
    });

    // If no dates are set (or fallback), check global sums as a safety
    if (maxDemand === 0) {
        const globalSums = { "Manhã": 0, "Tarde": 0 };
        entries.forEach(e => {
            if (e.turno === "Manhã") globalSums["Manhã"] += (parseInt(e.alunos) || 0);
            if (e.turno === "Tarde") globalSums["Tarde"] += (parseInt(e.alunos) || 0);
        });
        maxDemand = Math.max(globalSums["Manhã"], globalSums["Tarde"]);
    }

    const pct = aplicacaoMaxAparelhos > 0 ? Math.min((maxDemand / aplicacaoMaxAparelhos) * 100, 100) : 0;

    if (elProgressLabel) elProgressLabel.textContent = `Pico: ${maxDemand} alunos num único turno / ${aplicacaoMaxAparelhos} aparelhos (${pct.toFixed(0)}%)`;
    if (elProgressFill) {
        elProgressFill.style.width = pct + '%';
        elProgressFill.className = 'progress-bar-fill';
        if (maxDemand > aplicacaoMaxAparelhos) elProgressFill.classList.add('danger');
        else if (pct > 80) elProgressFill.classList.add('warning');
    }
}

function populateEscolasDatalist() {
    const datalist = document.getElementById('escolas-datalist');
    if (!datalist) return;
    datalist.innerHTML = '';
    const escolas = new Set(Object.values(aplicacaoData).map(e => e.escola));
    escolas.forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        datalist.appendChild(opt);
    });
}

window.renderAplicacaoAccordion = function () {
    const container = document.getElementById('escolas-accordion');
    if (!container) return;
    container.innerHTML = '';

    const searchTerm = (document.getElementById('busca-escola')?.value || '').toUpperCase();

    // Group by escola
    const grouped = {};
    Object.keys(aplicacaoData).forEach(key => {
        const item = aplicacaoData[key];
        if (!grouped[item.escola]) {
            grouped[item.escola] = { localidade: item.localidade, turmas: [] };
        }
        grouped[item.escola].turmas.push({ key, ...item });
    });

    // Sort schools alphabetically
    const sortedSchools = Object.keys(grouped).sort();

    sortedSchools.forEach(escolaNome => {
        if (searchTerm && !escolaNome.toUpperCase().includes(searchTerm)) return;

        const escola = grouped[escolaNome];
        const totalAlunos = escola.turmas.reduce((s, t) => s + (parseInt(t.alunos) || 0), 0);

        // Group by Turno + Data + Zona to condense repetition inside school
        const subGroups = {};
        escola.turmas.forEach(t => {
            const sgKey = `${t.turno}|${t.data}|${t.zona}`;
            if (!subGroups[sgKey]) {
                subGroups[sgKey] = {
                    turno: t.turno,
                    data: t.data,
                    zona: t.zona,
                    dia: t.dia,
                    totalAlunos: 0,
                    turmas: []
                };
            }
            subGroups[sgKey].turmas.push(t);
            subGroups[sgKey].totalAlunos += parseInt(t.alunos) || 0;
        });

        // Sort turmas inside each subgroup
        Object.values(subGroups).forEach(sg => {
            sg.turmas.sort((a, b) => a.turma.localeCompare(b.turma));
        });

        const sortedSubGroups = Object.values(subGroups).sort((a, b) => {
            if (a.turno !== b.turno) return a.turno.localeCompare(b.turno); // Manhã Before Tarde
            return (a.data || '').localeCompare(b.data || '');
        });

        const card = document.createElement('div');
        card.className = 'escola-card';

        card.innerHTML = `
            <div class="escola-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="escola-header-left">
                    <div class="escola-icon"><ion-icon name="school-outline"></ion-icon></div>
                    <div>
                        <div class="escola-title">${escolaNome}</div>
                        <div class="escola-subtitle">${escola.localidade} · ${escola.turmas.length} turmas · ${totalAlunos} alunos</div>
                    </div>
                </div>
                <div class="escola-header-right">
                    <span class="escola-badge">${totalAlunos} alunos</span>
                    <ion-icon name="chevron-down-outline" class="escola-chevron"></ion-icon>
                </div>
            </div>
            <div class="escola-body">
                <div class="escola-body-inner">
                    <table class="turma-table">
                        <thead>
                            <tr>
                                <th style="text-align: center;">Turno</th>
                                <th style="min-width: 250px;">Turmas (Qtd. Alunos)</th>
                                <th style="text-align: center;">Total Alunos</th>
                                <th>Data</th>
                                <th>Dia</th>
                                <th>Zona</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedSubGroups.map(sg => `
                                <tr>
                                    <td data-label="Turno" style="text-align: center;">
                                        <span class="badge-${sg.turno === 'Manhã' ? 'manha' : 'tarde'}">${sg.turno}</span>
                                    </td>
                                    <td data-label="Turmas (Qtd. Alunos)">
                                        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
                                            ${sg.turmas.map(t => `
                                                <div class="badge-group" style="display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; background: rgba(59, 130, 246, 0.05);">
                                                    <span class="badge badge-info" onclick="editAplicacaoModal('${t.key}')" title="Editar Turma: ${t.turma}" style="cursor: pointer; border: none; border-radius: 0; padding-right: 0.4rem;">
                                                        ${t.turma} <small style="opacity: 0.7; font-weight: normal; font-size: 0.7rem;">(${t.alunos})</small>
                                                    </span>
                                                    <div style="display: flex; background: rgba(0,0,0,0.05); padding: 0 0.2rem;">
                                                        <button class="btn-icon delete" onclick="deleteAplicacao('${t.key}')" title="Excluir Turma" style="padding: 0.1rem; font-size: 1rem;"><ion-icon name="trash-outline"></ion-icon></button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </td>
                                    <td data-label="Total Alunos" style="text-align: center; font-size: 1.1rem;"><strong>${sg.totalAlunos}</strong></td>
                                    <td data-label="Data">
                                        <span class="editable-cell" onclick="inlineEditData(this, '${sg.turmas.map(t => t.key).join(',')}')">${sg.data || '-'}</span>
                                    </td>
                                    <td data-label="Dia">
                                        <span class="editable-cell" onclick="inlineEditDia(this, '${sg.turmas.map(t => t.key).join(',')}')">${sg.dia || '-'}</span>
                                    </td>
                                    <td data-label="Zona">
                                        <span class="editable-cell" onclick="inlineEditZona(this, '${sg.turmas.map(t => t.key).join(',')}')">${sg.zona || '-'}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="padding: 1rem; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); background: var(--bg-card); display: flex; flex-direction: column; gap: 1rem;">
                        <span style="display: flex; align-items: flex-start; gap: 0.5rem;"><ion-icon name="information-circle-outline" style="font-size: 1.2rem; color: var(--primary); flex-shrink: 0;"></ion-icon> <span style="flex: 1;">Clique no valor de Data, Dia ou Zona para editá-los e clique em Salvar Ajustes. Lápis ou duplo clique no badge para edição completa.</span></span>
                        <div class="escola-footer-actions" style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: flex-start;">
                            <button class="btn-save-escola" onclick="saveCardEdits(this)" style="background-color: var(--green); color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: background-color 0.2s;">
                                <ion-icon name="checkmark-outline"></ion-icon> Salvar Ajustes
                            </button>
                            <button class="btn-add-turma" onclick="addTurmaToEscola('${escolaNome}', '${escola.localidade}')">
                                <ion-icon name="add-outline"></ion-icon> Adicionar Turma
                            </button>
                            <button class="btn-delete-escola" onclick="deleteEscola('${escolaNome}')">
                                <ion-icon name="trash-outline"></ion-icon> Excluir Escola
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    if (container.children.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 3rem;">Nenhuma escola encontrada.</div>`;
    }
}

// VIEW SWITCHER
window.setViewMode = function (mode) {
    currentViewMode = mode;

    // Update button styles
    const btnEscola = document.getElementById('btn-view-escola');
    const btnData = document.getElementById('btn-view-data');

    if (btnEscola) btnEscola.classList.toggle('active', mode === 'escola');
    if (btnData) btnData.classList.toggle('active', mode === 'data');

    if (mode === 'escola') {
        renderAplicacaoAccordion();
    } else {
        renderAplicacaoByDate();
    }
};

window.renderAplicacaoByDate = function () {
    const container = document.getElementById('escolas-accordion');
    if (!container) return;
    container.innerHTML = '';

    const searchTerm = (document.getElementById('busca-escola')?.value || '').toUpperCase();

    // Group by Date + Dia + Zona
    const grouped = {};
    Object.keys(aplicacaoData).forEach(key => {
        const item = aplicacaoData[key];

        // Filter logic inside date view is searching by school or location
        if (searchTerm &&
            !item.escola.toUpperCase().includes(searchTerm) &&
            !item.localidade.toUpperCase().includes(searchTerm)) {
            return;
        }

        const dateKey = item.data ? `${item.data} (${item.dia || '-'})` : 'SEM DATA DEFINIDA';
        const groupKey = `${dateKey} | Zona: ${item.zona || 'Não informada'}`;

        if (!grouped[groupKey]) {
            grouped[groupKey] = { turmas: [] };
        }
        grouped[groupKey].turmas.push({ key, ...item });
    });

    // Sort Groups
    const sortedGroups = Object.keys(grouped).sort((a, b) => {
        if (a.includes('SEM DATA') && !b.includes('SEM DATA')) return 1;
        if (!a.includes('SEM DATA') && b.includes('SEM DATA')) return -1;
        return a.localeCompare(b);
    });

    sortedGroups.forEach(groupName => {
        const group = grouped[groupName];
        const totalAlunos = group.turmas.reduce((s, t) => s + (parseInt(t.alunos) || 0), 0);

        // Group by Escola + Turno to reduce repetition
        const subGroups = {};
        group.turmas.forEach(t => {
            const sgKey = `${t.escola}|${t.localidade}|${t.turno}`;
            if (!subGroups[sgKey]) {
                subGroups[sgKey] = {
                    escola: t.escola,
                    localidade: t.localidade,
                    turno: t.turno,
                    totalAlunos: 0,
                    turmas: []
                };
            }
            subGroups[sgKey].turmas.push(t);
            subGroups[sgKey].totalAlunos += parseInt(t.alunos) || 0;
        });

        // Sort Turmas inside subgroups by Name
        Object.values(subGroups).forEach(sg => {
            sg.turmas.sort((a, b) => a.turma.localeCompare(b.turma));
        });

        const sortedSubGroups = Object.values(subGroups).sort((a, b) => {
            if (a.turno !== b.turno) return a.turno.localeCompare(b.turno); // Manhã Before Tarde
            return a.escola.localeCompare(b.escola);
        });

        const card = document.createElement('div');
        card.className = 'escola-card';

        // Custom icon depending on 'Sem Data'
        const iconName = groupName.includes('SEM DATA') ? 'help-circle-outline' : 'calendar-outline';

        card.innerHTML = `
            <div class="escola-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="escola-header-left">
                    <div class="escola-icon"><ion-icon name="${iconName}"></ion-icon></div>
                    <div>
                        <div class="escola-title">${groupName}</div>
                        <div class="escola-subtitle">${group.turmas.length} turmas nesta data/zona · ${totalAlunos} alunos envolvidos</div>
                    </div>
                </div>
                <div class="escola-header-right">
                    <span class="escola-badge">${totalAlunos} alunos previstos</span>
                    <ion-icon name="chevron-down-outline" class="escola-chevron"></ion-icon>
                </div>
            </div>
            <div class="escola-body">
                <div class="escola-body-inner">
                    <table class="turma-table">
                        <thead>
                            <tr>
                                <th>Escola</th>
                                <th>Localidade</th>
                                <th style="min-width: 250px;">Turmas (Qtd. Alunos)</th>
                                <th style="text-align: center;">Total Alunos</th>
                                <th style="text-align: center;">Turno</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedSubGroups.map(sg => `
                                <tr>
                                    <td data-label="Escola"><strong>${sg.escola}</strong></td>
                                    <td data-label="Localidade">${sg.localidade}</td>
                                    <td data-label="Turmas (Qtd. Alunos)">
                                        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center;">
                                            ${sg.turmas.map(t => `
                                                <div class="badge-group" style="display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; background: rgba(59, 130, 246, 0.05);">
                                                    <span class="badge badge-info" onclick="editAplicacaoModal('${t.key}')" title="Editar Turma: ${t.turma}" style="cursor: pointer; border: none; border-radius: 0; padding-right: 0.4rem;">
                                                        ${t.turma} <small style="opacity: 0.7; font-weight: normal; font-size: 0.7rem;">(${t.alunos})</small>
                                                    </span>
                                                    <div style="display: flex; background: rgba(0,0,0,0.05); padding: 0 0.2rem;">
                                                        <button class="btn-icon delete" onclick="deleteAplicacao('${t.key}')" title="Excluir Turma" style="padding: 0.1rem; font-size: 1rem;"><ion-icon name="trash-outline"></ion-icon></button>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </td>
                                    <td data-label="Total Alunos" style="text-align: center; font-size: 1.1rem;"><strong>${sg.totalAlunos}</strong></td>
                                    <td data-label="Turno" style="text-align: center;">
                                        <span class="badge-${sg.turno === 'Manhã' ? 'manha' : 'tarde'}">${sg.turno}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="padding: 1rem; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); background: var(--bg-card); display: flex; align-items: flex-start; gap: 0.5rem;">
                        <ion-icon name="information-circle-outline" style="font-size: 1.2rem; color: var(--primary); flex-shrink: 0;"></ion-icon>
                        <span style="flex: 1;">Clique em qualquer turma para editá-la completamente.</span>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    if (container.children.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 3rem;">Nenhuma turma encontrada nesta visualização.</div>`;
    }
};

// OVERRIDE CALLS DEPENDING ON VIEW
const originalFilterEscolas = window.filterEscolas;
window.filterEscolas = function () {
    if (currentViewMode === 'escola') renderAplicacaoAccordion();
    else renderAplicacaoByDate();
};

// --- Inline Editing ---
window.inlineEdit = function (el, key, field) {
    if (el.querySelector('input')) return; // Already editing

    const currentValue = el.textContent.trim() === '-' ? '' : aplicacaoData[key][field];
    const inputType = field === 'alunos' ? 'number' : 'text';
    el.innerHTML = `<input type="${inputType}" value="${currentValue}" data-key="${key}" data-field="${field}" style="width: ${field === 'alunos' ? '60px' : '80px'}; padding: 4px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-family: inherit;">`;
    const input = el.querySelector('input');
    input.focus();
    input.select();
};

window.inlineEditTurno = function (el, key) {
    if (el.querySelector('select')) return;

    const current = aplicacaoData[key].turno;
    el.innerHTML = `<select data-key="${key}" data-field="turno" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-family: inherit;"><option value="Manhã" ${current === 'Manhã' ? 'selected' : ''}>Manhã</option><option value="Tarde" ${current === 'Tarde' ? 'selected' : ''}>Tarde</option></select>`;
    const select = el.querySelector('select');
    select.focus();
};

window.inlineEditData = function (el, keys) {
    if (el.querySelector('input')) return;
    const firstKey = keys.split(',')[0];
    const current = aplicacaoData[firstKey].data || '';
    el.innerHTML = `<input type="date" value="${current}" data-keys="${keys}" data-field="data" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-family: inherit;">`;
    const input = el.querySelector('input');
    input.focus();
};

window.inlineEditDia = function (el, keys) {
    if (el.querySelector('select')) return;
    const firstKey = keys.split(',')[0];
    const current = aplicacaoData[firstKey].dia || '';
    const options = ["", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado", "Domingo"];
    el.innerHTML = `<select data-keys="${keys}" data-field="dia" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-family: inherit;">${options.map(opt => `<option value="${opt}" ${current === opt ? 'selected' : ''}>${opt || 'Selecione...'}</option>`).join('')}</select>`;
    const select = el.querySelector('select');
    select.focus();
};

window.inlineEditZona = function (el, keys) {
    if (el.querySelector('select')) return;
    const firstKey = keys.split(',')[0];
    const current = aplicacaoData[firstKey].zona || '';
    const options = ["", "Urbana", "Rural", "Urbana/Rural"];
    el.innerHTML = `<select data-keys="${keys}" data-field="zona" style="padding: 4px; border: 1px solid #ccc; border-radius: 4px; outline: none; font-family: inherit;">${options.map(opt => `<option value="${opt}" ${current === opt ? 'selected' : ''}>${opt || 'Selecione...'}</option>`).join('')}</select>`;
    const select = el.querySelector('select');
    select.focus();
};

window.saveCardEdits = function (btn) {
    const card = btn.closest('.escola-card');
    if (!card) return;

    const inputs = card.querySelectorAll('input[data-key], select[data-key], input[data-keys], select[data-keys]');
    if (inputs.length === 0) {
        return; // Nothing to save
    }

    const updates = {};
    let hasChanges = false;

    inputs.forEach(input => {
        const keysAttr = input.getAttribute('data-keys');
        const keyAttr = input.getAttribute('data-key');
        const keys = keysAttr ? keysAttr.split(',') : (keyAttr ? [keyAttr] : []);

        const field = input.getAttribute('data-field');
        let val = input.value;
        if (field === 'alunos') val = parseInt(val) || 0;

        keys.forEach(key => {
            // Compare current input value with the backend value
            if (aplicacaoData[key] && aplicacaoData[key][field] !== val) {
                updates[`${key}/${field}`] = val;
                hasChanges = true;
            }
        });
    });

    if (hasChanges) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin-icon"></ion-icon> Salvando...';
        btn.disabled = true;
        database.ref('aplicacoes').update(updates)
            .then(() => {
                // UI automatically re-renders based on Firebase value event
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao salvar ajustes.');
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
    } else {
        // Just cleanly reset UI if no actual changes were made
        if (currentViewMode === 'escola') renderAplicacaoAccordion();
        else renderAplicacaoByDate();
    }
};


// --- CRUD ---
function handleAddAplicacao(e) {
    e.preventDefault();
    showLoading(true);

    const payload = {
        escola: document.getElementById('ap-escola').value,
        localidade: document.getElementById('ap-localidade').value,
        turma: document.getElementById('ap-turma').value,
        alunos: parseInt(document.getElementById('ap-alunos').value) || 0,
        turno: document.getElementById('ap-turno').value,
        data: document.getElementById('ap-data').value,
        dia: document.getElementById('ap-dia').value,
        zona: document.getElementById('ap-zona').value
    };

    if (currentEditAplicacaoId) {
        database.ref('aplicacoes/' + currentEditAplicacaoId).update(payload)
            .then(() => {
                document.getElementById('form-aplicacao').reset();
                closeModalAplicacao();
                showLoading(false);
                currentEditAplicacaoId = null;
                resetAplicacaoSubmitButton();
            }).catch(err => { console.error(err); showLoading(false); });
    } else {
        payload.timestamp = firebase.database.ServerValue.TIMESTAMP;
        database.ref('aplicacoes').push().set(payload)
            .then(() => {
                document.getElementById('form-aplicacao').reset();
                closeModalAplicacao();
                showLoading(false);
            }).catch(err => {
                console.error(err); showLoading(false);
                alert("Erro ao salvar turma.");
            });
    }
}

window.editAplicacaoModal = function (key) {
    if (!aplicacaoData[key]) return;
    const item = aplicacaoData[key];
    currentEditAplicacaoId = key;

    document.getElementById('ap-escola').value = item.escola || '';
    document.getElementById('ap-localidade').value = item.localidade || '';
    document.getElementById('ap-turma').value = item.turma || '';
    document.getElementById('ap-alunos').value = item.alunos || '';
    document.getElementById('ap-turno').value = item.turno || 'Manhã';
    document.getElementById('ap-data').value = item.data || '';
    document.getElementById('ap-dia').value = item.dia || '';
    document.getElementById('ap-zona').value = item.zona || '';

    const form = document.getElementById('form-aplicacao');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Salvar Alterações';

    openModalAplicacao();
};

function resetAplicacaoSubmitButton() {
    const form = document.getElementById('form-aplicacao');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Salvar Turma';
}

window.deleteAplicacao = function (key) {
    if (confirm("Excluir esta turma?")) {
        showLoading(true);
        database.ref('aplicacoes/' + key).remove()
            .then(() => showLoading(false))
            .catch(err => { console.error(err); showLoading(false); alert("Erro ao excluir."); });
    }
};

window.deleteEscola = function (escolaNome) {
    if (!confirm(`Excluir TODAS as turmas da escola "${escolaNome}"?`)) return;
    showLoading(true);
    const updates = {};
    Object.keys(aplicacaoData).forEach(key => {
        if (aplicacaoData[key].escola === escolaNome) {
            updates[key] = null;
        }
    });
    database.ref('aplicacoes').update(updates)
        .then(() => showLoading(false))
        .catch(err => { console.error(err); showLoading(false); });
};

window.addTurmaToEscola = function (escolaNome, localidade) {
    document.getElementById('ap-escola').value = escolaNome;
    document.getElementById('ap-localidade').value = localidade;
    document.getElementById('ap-turma').value = '';
    document.getElementById('ap-alunos').value = '';
    currentEditAplicacaoId = null;
    resetAplicacaoSubmitButton();
    openModalAplicacao();
};

window.editMaxAparelhos = function () {
    const newMax = prompt("Defina a quantidade máxima de aparelhos:", aplicacaoMaxAparelhos);
    if (newMax !== null && !isNaN(parseInt(newMax))) {
        database.ref('configAplicacao/maxAparelhos').set(parseInt(newMax));
    }
};

window.filterEscolas = function () {
    renderAplicacaoAccordion();
};

window.openModalAplicacao = function () {
    const modal = document.getElementById('modal-aplicacao');
    if (modal) modal.classList.add('active');
};

window.closeModalAplicacao = function () {
    const modal = document.getElementById('modal-aplicacao');
    if (modal) modal.classList.remove('active');
    currentEditAplicacaoId = null;
    resetAplicacaoSubmitButton();
};

window.resetAplicacaoSeed = function () {
    if (confirm("Isso apagará todos os dados atuais e reiniciará com os novos dados de exemplo. Continuar?")) {
        showLoading(true);
        database.ref('aplicacoes').remove()
            .then(() => {
                seedAplicacaoData();
                showLoading(false);
                alert("Dados resetados com sucesso!");
            })
            .catch(err => {
                console.error(err);
                showLoading(false);
                alert("Erro ao resetar dados.");
            });
    }
};


