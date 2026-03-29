<?php
/**
 * ================================================================
 *  LETREIRO DIGITAL — WEBHOOK ASAAS (webhook.php)
 * ================================================================
 * Configure este URL no painel do Asaas:
 *   https://seu-servidor.com/webhook.php
 *
 * Fluxo:
 *   Asaas → PAYMENT_RECEIVED → este script
 *       → extrai HWID (externalReference)
 *       → atualiza Firebase: licencas/{HWID} = ativo
 *       → App listener detecta a mudança → libera acesso
 * ================================================================
 */

// ----------------------------------------------------------------
// CONFIGURAÇÕES
// ----------------------------------------------------------------
$webhookToken = 'SEU_WEBHOOK_TOKEN_SECRETO'; // Configure no painel Asaas > Webhooks

// Firebase
$firebaseProjectId = 'letreirodigital-88f8e';
// Service Account Token — gere em console.firebase.google.com > Configurações > Contas de serviço
// Em produção, use autenticação via JWT (google-auth-library)
$firebaseToken = getenv('FIREBASE_SERVICE_TOKEN') ?: 'SEU_SERVICE_ACCOUNT_TOKEN_AQUI';

// Duração da licença por plano
$duracaoPlano = [
    'MENSAL' => '+1 month',
    'ANUAL'  => '+1 year',
];

// ----------------------------------------------------------------
// SEGURANÇA: Verificar token do webhook
// ----------------------------------------------------------------
$tokenRecebido = $_GET['token'] ?? ''; // Configure a URL como: /webhook.php?token=SEU_TOKEN
if ($tokenRecebido !== $webhookToken) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ----------------------------------------------------------------
// 1. LER PAYLOAD DO ASAAS
// ----------------------------------------------------------------
$payload = json_decode(file_get_contents('php://input'), true);

if (!$payload || !isset($payload['event'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Payload inválido']);
    exit;
}

$evento   = $payload['event'];
$payment  = $payload['payment'] ?? [];

// ----------------------------------------------------------------
// REGISTRAR NO LOG (debug — desabilite em produção se necessário)
// ----------------------------------------------------------------
$logEntry = date('Y-m-d H:i:s') . " | Evento: $evento | PaymentID: " . ($payment['id'] ?? 'N/A') . "\n";
file_put_contents(__DIR__ . '/webhook_log.txt', $logEntry, FILE_APPEND | LOCK_EX);

// ----------------------------------------------------------------
// 2. PROCESSAR APENAS PAGAMENTOS CONFIRMADOS
// ----------------------------------------------------------------
$eventosConfirmacao = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'];

if (!in_array($evento, $eventosConfirmacao)) {
    http_response_code(200);
    echo json_encode(['status' => 'ignorado', 'evento' => $evento]);
    exit;
}

// ----------------------------------------------------------------
// 3. EXTRAIR HWID DO externalReference
// ----------------------------------------------------------------
$hwid      = $payment['externalReference'] ?? '';
$paymentId = $payment['id']               ?? '';
$valor     = $payment['value']            ?? 0;
$plano     = determinarPlano($valor);      // Deduz o plano pelo valor pago

if (empty($hwid)) {
    registrarLog("ERRO: externalReference (HWID) ausente no pagamento $paymentId");
    http_response_code(200); // Retorna 200 para Asaas não reenviar
    echo json_encode(['status' => 'erro', 'mensagem' => 'HWID ausente']);
    exit;
}

// ----------------------------------------------------------------
// 4. CALCULAR DATA DE EXPIRAÇÃO
// ----------------------------------------------------------------
$duracao    = $duracaoPlano[$plano] ?? '+1 month';
$expiracao  = date('Y-m-d', strtotime($duracao));

// ----------------------------------------------------------------
// 5. ATUALIZAR NO FIREBASE FIRESTORE: licencas/{HWID}
// ----------------------------------------------------------------
$sucesso = ativarLicencaNoFirebase($hwid, $paymentId, $plano, $expiracao, $firebaseProjectId, $firebaseToken);

if ($sucesso) {
    registrarLog("✅ Licença ATIVADA | HWID: $hwid | Plano: $plano | Expira: $expiracao");
    http_response_code(200);
    echo json_encode(['status' => 'sucesso', 'hwid' => $hwid, 'plano' => $plano, 'expiracao' => $expiracao]);
} else {
    registrarLog("❌ FALHA ao ativar | HWID: $hwid | PaymentID: $paymentId");
    http_response_code(500);
    echo json_encode(['status' => 'erro', 'mensagem' => 'Falha ao atualizar Firebase']);
}


// ================================================================
// FUNÇÕES AUXILIARES
// ================================================================

function ativarLicencaNoFirebase(
    string $hwid,
    string $paymentId,
    string $plano,
    string $expiracao,
    string $projectId,
    string $token
): bool {
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/licencas/$hwid";

    $body = json_encode([
        'fields' => [
            'status'          => ['stringValue' => 'ativo'],
            'hwid'            => ['stringValue' => $hwid],
            'plano'           => ['stringValue' => $plano],
            'payment_id'      => ['stringValue' => $paymentId],
            'data_ativacao'   => ['stringValue' => date('Y-m-d H:i:s')],
            'data_expiracao'  => ['stringValue' => $expiracao],
            'chave'           => ['stringValue' => gerarChaveLicenca($hwid)],
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
        CURLOPT_TIMEOUT => 10,
    ]);

    $response   = curl_exec($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode >= 200 && $httpCode < 300;
}

function gerarChaveLicenca(string $hwid): string {
    // Gera uma chave legível e única baseada no HWID
    $hash = strtoupper(substr(hash('sha256', $hwid . date('Y') . 'LETREIRO_SALT'), 0, 20));
    return implode('-', str_split($hash, 5)); // Formato: XXXXX-XXXXX-XXXXX-XXXXX
}

function determinarPlano(float $valor): string {
    if ($valor >= 200) return 'ANUAL';
    return 'MENSAL';
}

function registrarLog(string $mensagem): void {
    $entry = date('Y-m-d H:i:s') . " | $mensagem\n";
    file_put_contents(__DIR__ . '/webhook_log.txt', $entry, FILE_APPEND | LOCK_EX);
}
