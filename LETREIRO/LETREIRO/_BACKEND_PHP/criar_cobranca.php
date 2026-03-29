<?php
/**
 * ================================================================
 *  LETREIRO DIGITAL — BRIDGE DE PAGAMENTO (criar_cobranca.php)
 * ================================================================
 * SEGURANÇA: A API Key do Asaas vive APENAS aqui, nunca no app.
 * Hospede este arquivo em um servidor PHP seguro (ex: hospedagem,
 * VPS ou Vercel PHP) com HTTPS obrigatório.
 *
 * O App Desktop envia: { hwid, plano, nome, cpfCnpj, email, telefone }
 * Este script retorna: { qrCodeBase64, pixCopyPaste, invoiceUrl, paymentId }
 * ================================================================
 */

// ----------------------------------------------------------------
// CONFIGURAÇÕES — NÃO commite a API Key em repositórios públicos!
// Use variáveis de ambiente em produção:
//   $asaasApiKey = getenv('ASAAS_API_KEY');
// ----------------------------------------------------------------
$asaasApiKey    = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmM3ZjM4ZDUwLTkxMWItNGU2Ni04YzYyLTBlOGUxZjRiZjRjNTo6JGFhY2hfYzZjZmQ2ZmYtZThlZi00MTFiLWE5ODMtNjUxNTdlNDVhMTk2';
$asaasBaseUrl   = 'https://sandbox.asaas.com/api/v3'; // Troque para https://api.asaas.com/v3 em produção

// Firebase Firestore REST
$firebaseProjectId = 'letreirodigital-88f8e';
$firebaseServiceAccountToken = ''; // Token de acesso para Firebase Admin (gere via service account)

// ----------------------------------------------------------------
// CORS — Permite apenas origens confiáveis em produção
// ----------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Em produção: restrinja ao seu domínio
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { responder_erro(405, 'Método não permitido.'); }

// ----------------------------------------------------------------
// 1. LER E VALIDAR DADOS DO APP
// ----------------------------------------------------------------
$input = json_decode(file_get_contents('php://input'), true);

$hwid      = sanitizarTexto($input['hwid']      ?? '');
$plano     = strtoupper($input['plano']         ?? 'MENSAL'); // MENSAL ou ANUAL
$nome      = sanitizarTexto($input['nome']      ?? '');
$cpfCnpj   = preg_replace('/\D/', '', $input['cpfCnpj']  ?? '');
$email     = filter_var($input['email'] ?? '', FILTER_SANITIZE_EMAIL);
$telefone  = preg_replace('/\D/', '', $input['telefone'] ?? '');

if (empty($hwid) || empty($nome) || empty($cpfCnpj) || empty($email)) {
    responder_erro(400, 'Dados obrigatórios ausentes: hwid, nome, cpfCnpj, email.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder_erro(400, 'E-mail inválido.');
}

if (!in_array(strlen($cpfCnpj), [11, 14])) {
    responder_erro(400, 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos.');
}

// Valores por plano
$valoresPlano = ['MENSAL' => 29.00, 'ANUAL' => 249.00];
$ciclosPlano  = ['MENSAL' => 'MONTHLY', 'ANUAL' => 'YEARLY'];

if (!isset($valoresPlano[$plano])) responder_erro(400, 'Plano inválido. Use MENSAL ou ANUAL.');

$valor = $valoresPlano[$plano];
$ciclo = $ciclosPlano[$plano];

// ----------------------------------------------------------------
// 2. CRIAR OU BUSCAR CLIENTE NO ASAAS
// ----------------------------------------------------------------
$clienteId = buscarClientePorCpfCnpj($cpfCnpj, $asaasApiKey, $asaasBaseUrl);

if (!$clienteId) {
    $clienteId = criarCliente([
        'name'        => $nome,
        'cpfCnpj'     => $cpfCnpj,
        'email'       => $email,
        'mobilePhone' => $telefone,
    ], $asaasApiKey, $asaasBaseUrl);
}

if (!$clienteId) responder_erro(500, 'Não foi possível criar o cliente no Asaas.');

// ----------------------------------------------------------------
// 3. CRIAR COBRANÇA PIX (o externalReference = HWID)
// ----------------------------------------------------------------
$vencimento  = date('Y-m-d', strtotime('+3 days'));
$descricao   = "Letreiro Digital — Plano $plano";

$cobranca = criarCobranca([
    'customer'          => $clienteId,
    'billingType'       => 'PIX',
    'value'             => $valor,
    'dueDate'           => $vencimento,
    'description'       => $descricao,
    'externalReference' => $hwid, // ← CHAVE: Vincula ao HWID
], $asaasApiKey, $asaasBaseUrl);

if (!$cobranca || empty($cobranca['id'])) {
    responder_erro(500, 'Erro ao criar cobrança: ' . ($cobranca['errors'][0]['description'] ?? 'Desconhecido'));
}

$paymentId = $cobranca['id'];

// ----------------------------------------------------------------
// 4. OBTER QR CODE PIX
// ----------------------------------------------------------------
$pixData = obterQrCodePix($paymentId, $asaasApiKey, $asaasBaseUrl);

// ----------------------------------------------------------------
// 5. REGISTRAR PAGAMENTO PENDENTE NO FIREBASE
// ----------------------------------------------------------------
registrarPagamentoPendente($hwid, $paymentId, $plano, $firebaseProjectId, $firebaseServiceAccountToken);

// ----------------------------------------------------------------
// 6. RETORNAR DADOS AO APP
// ----------------------------------------------------------------
echo json_encode([
    'success'       => true,
    'paymentId'     => $paymentId,
    'qrCodeBase64'  => $pixData['encodedImage'] ?? '',
    'pixCopyPaste'  => $pixData['payload']       ?? '',
    'invoiceUrl'    => $cobranca['invoiceUrl']   ?? '',
    'valor'         => $valor,
    'plano'         => $plano,
    'vencimento'    => $vencimento,
]);


// ================================================================
// FUNÇÕES AUXILIARES
// ================================================================

function buscarClientePorCpfCnpj(string $cpfCnpj, string $apiKey, string $baseUrl): ?string {
    $resp = asaasGet("/customers?cpfCnpj=$cpfCnpj", $apiKey, $baseUrl);
    if (!empty($resp['data'][0]['id'])) return $resp['data'][0]['id'];
    return null;
}

function criarCliente(array $dados, string $apiKey, string $baseUrl): ?string {
    $resp = asaasPost('/customers', $dados, $apiKey, $baseUrl);
    return $resp['id'] ?? null;
}

function criarCobranca(array $dados, string $apiKey, string $baseUrl): ?array {
    return asaasPost('/payments', $dados, $apiKey, $baseUrl);
}

function obterQrCodePix(string $paymentId, string $apiKey, string $baseUrl): array {
    $resp = asaasGet("/payments/$paymentId/pixQrCode", $apiKey, $baseUrl);
    return $resp ?? [];
}

function registrarPagamentoPendente(string $hwid, string $paymentId, string $plano, string $projectId, string $token): void {
    // Registra no Firestore (será atualizado para "ativo" pelo webhook)
    if (empty($token)) return; // Pula se não configurado ainda

    $url  = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/licencas/$hwid";
    $body = json_encode([
        'fields' => [
            'status'         => ['stringValue' => 'pendente_pagamento'],
            'payment_id'     => ['stringValue' => $paymentId],
            'plano'          => ['stringValue' => $plano],
            'hwid'           => ['stringValue' => $hwid],
            'data_criacao'   => ['stringValue' => date('Y-m-d H:i:s')],
        ]
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => 'PATCH',
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "Authorization: Bearer $token",
            'Content-Type: application/json',
        ],
    ]);
    curl_exec($ch);
    curl_close($ch);
}

function asaasGet(string $endpoint, string $apiKey, string $baseUrl): array {
    $ch = curl_init($baseUrl . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "access_token: $apiKey",
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true) ?? [];
}

function asaasPost(string $endpoint, array $dados, string $apiKey, string $baseUrl): array {
    $ch = curl_init($baseUrl . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($dados),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            "access_token: $apiKey",
            'Content-Type: application/json',
        ],
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true) ?? [];
}

function sanitizarTexto(string $texto): string {
    return htmlspecialchars(strip_tags(trim($texto)), ENT_QUOTES, 'UTF-8');
}

function responder_erro(int $code, string $mensagem): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $mensagem]);
    exit;
}
