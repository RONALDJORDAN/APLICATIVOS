# Robô de Extração de Alunos (Python)

## Objetivo

Criar um script de automação em Python para extrair dados de alunos sem enturmação de um sistema escolar e armazená-los de forma estruturada, garantindo que não haja registros duplicados.

## Requisitos Tecnológicos

- **Linguagem:** Python 3.x
- **Biblioteca Principal:** Selenium WebDriver (Web) ou PyAutoGUI (Desktop) - A ser definido.
- **Manipulação de Dados:** Pandas
- **Saída:** Arquivo Excel (.xlsx)

## Fluxo de Execução

1. **Acesso:** Login no sistema e navegação até a tela de consulta.
2. **Filtragem:** Selecionar "Sem Enturmação".
3. **Extração:** Capturar Nome, Código, e Escola.
4. **Processamento:** Criar chave única `codigo_aluno + nome_aluno` e evitar duplicatas.
5. **Persistência:** Salvar em Excel/CSV.

## Como Executar

1. Instale as dependências: `pip install -r requirements.txt`
2. Configure as credenciais no arquivo `.env` (se necessário).
3. Execute o script principal: `python main.py`
