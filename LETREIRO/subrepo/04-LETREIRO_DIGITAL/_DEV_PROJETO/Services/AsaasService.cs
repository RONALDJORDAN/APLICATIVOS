using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace LetreiroDigital.Services
{
    /// <summary>
    /// Serviço de pagamento via Bridge PHP segura.
    /// O app NUNCA chama o Asaas diretamente — a API Key fica só no servidor.
    /// Configure a URL abaixo para o seu servidor PHP.
    /// </summary>
    public class AsaasService
    {
        // ---------------------------------------------------------------
        // CONFIGURAÇÕES — URL do seu servidor PHP
        // ---------------------------------------------------------------

        /// <summary>
        /// URL base do backend PHP. Deve ter HTTPS em produção.
        /// </summary>
        public static string BridgeUrl = "https://seu-servidor.com/letreiro"; // ← configure aqui

        private static readonly HttpClient _http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

        // ---------------------------------------------------------------
        // SOLICITAR PAGAMENTO (PIX) — chama create_cobranca.php
        // ---------------------------------------------------------------

        /// <summary>
        /// Envia dados ao PHP Bridge para criar cobrança PIX vinculada ao HWID.
        /// Retorna o QR Code (Base64), código Copia e Cola e link da fatura.
        /// </summary>
        public static async Task<BridgePaymentResponse?> SolicitarPagamentoPixAsync(
            string hwid,
            string plano,   // "MENSAL" ou "ANUAL"
            string nome,
            string cpfCnpj,
            string email,
            string telefone = "")
        {
            var payload = new
            {
                hwid      = hwid,
                plano     = plano,
                nome      = nome,
                cpfCnpj   = cpfCnpj,
                email     = email,
                telefone  = telefone,
            };

            var json    = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                var resp = await _http.PostAsync($"{BridgeUrl}/criar_cobranca.php", content);
                var body = await resp.Content.ReadAsStringAsync();

                if (!resp.IsSuccessStatusCode)
                    throw new Exception($"Bridge HTTP {(int)resp.StatusCode}: {body}");

                var result = JsonSerializer.Deserialize<BridgePaymentResponse>(body);

                if (result?.Success == false)
                    throw new Exception(result?.Error ?? "Erro desconhecido na bridge.");

                return result;
            }
            catch (HttpRequestException ex)
            {
                throw new Exception($"Sem conexão com o servidor de pagamentos. Verifique sua internet.\nDetalhes: {ex.Message}");
            }
        }

        // ---------------------------------------------------------------
        // VERIFICAR STATUS DO PAGAMENTO (consulta direta ao Asaas via bridge)
        // ---------------------------------------------------------------

        /// <summary>
        /// Verifica o status de um pagamento pelo ID.
        /// Nota: com o Firebase listener, isso é opcional (o webhook já atualiza).
        /// </summary>
        public static async Task<string> VerificarStatusPagamentoAsync(string paymentId)
        {
            try
            {
                var resp = await _http.GetAsync($"{BridgeUrl}/verificar_status.php?paymentId={paymentId}");
                var body = await resp.Content.ReadAsStringAsync();
                var result = JsonDocument.Parse(body);
                return result.RootElement.GetProperty("status").GetString() ?? "DESCONHECIDO";
            }
            catch
            {
                return "ERRO";
            }
        }
    }

    // ---------------------------------------------------------------
    // MODELOS
    // ---------------------------------------------------------------

    public class BridgePaymentResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("success")]
        public bool Success { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("paymentId")]
        public string? PaymentId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("qrCodeBase64")]
        public string? QrCodeBase64 { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("pixCopyPaste")]
        public string? PixCopyPaste { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("invoiceUrl")]
        public string? InvoiceUrl { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("valor")]
        public decimal Valor { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("plano")]
        public string? Plano { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("vencimento")]
        public string? Vencimento { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    // Classes mantidas para compatibilidade com código existente
    public class AsaasPixQrCode
    {
        [System.Text.Json.Serialization.JsonPropertyName("encodedImage")]
        public string? EncodedImage { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("payload")]
        public string? Payload { get; set; }
    }

    public class AsaasCreditCard
    {
        public string? holderName { get; set; }
        public string? number { get; set; }
        public string? expiryMonth { get; set; }
        public string? expiryYear { get; set; }
        public string? ccv { get; set; }
    }

    public class AsaasCreditCardHolder
    {
        public string? name { get; set; }
        public string? email { get; set; }
        public string? cpfCnpj { get; set; }
        public string? postalCode { get; set; }
        public string? addressNumber { get; set; }
        public string? phone { get; set; }
    }

    public class AsaasPaymentResponse
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string? Id { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("status")]
        public string? Status { get; set; }
    }
}
