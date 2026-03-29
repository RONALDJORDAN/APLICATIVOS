using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace LetreiroDigital.Services
{
    /// <summary>
    /// Serviço de comunicação com o Firebase Firestore via REST API.
    /// Documentação: https://firebase.google.com/docs/firestore/use-rest-api
    /// </summary>
    public class FirebaseService
    {
        // ---------------------------------------------------------------
        // CONFIGURAÇÕES — preencha com seu projeto Firebase
        // ---------------------------------------------------------------
        private const string ProjectId  = "letreirodigital-88f8e"; // ID do projeto no Firebase console
        private const string ApiKey     = "SUA_FIREBASE_WEB_API_KEY"; // Necessário para autenticação pública

        private static readonly string FirestoreBase =
            "https://firestore.googleapis.com/v1/projects/" + ProjectId + "/databases/(default)/documents";

        private static readonly HttpClient _http = new HttpClient();

        // ---------------------------------------------------------------
        // VERIFICAR LICENÇA POR HWID
        // ---------------------------------------------------------------

        /// <summary>
        /// Consulta o Firestore em licencas/{hwid}.
        /// Retorna o status: "ativo", "expirado", "nao_encontrado".
        /// </summary>
        public static async Task<LicenseStatus> VerificarLicencaPorHwidAsync(string hwid)
        {
            try
            {
                var url = $"{FirestoreBase}/licencas/{hwid}?key={ApiKey}";
                var resp = await _http.GetAsync(url);

                if (resp.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return new LicenseStatus { Status = "nao_encontrado" };

                if (!resp.IsSuccessStatusCode)
                    return new LicenseStatus { Status = "erro", Mensagem = $"HTTP {(int)resp.StatusCode}" };

                var body  = await resp.Content.ReadAsStringAsync();
                var doc   = JsonDocument.Parse(body);
                var fields = doc.RootElement.GetProperty("fields");

                string status       = GetStringField(fields, "status");
                string expiracao    = GetStringField(fields, "data_expiracao");
                string chave        = GetStringField(fields, "chave");

                // Verifica expiração
                if (status == "ativo" && DateTime.TryParse(expiracao, out var dataExp))
                {
                    if (dataExp < DateTime.Today)
                        return new LicenseStatus { Status = "expirado", DataExpiracao = dataExp, Chave = chave };
                }

                return new LicenseStatus { Status = status, DataExpiracao = DateTime.TryParse(expiracao, out var d) ? d : null, Chave = chave };
            }
            catch (Exception ex)
            {
                return new LicenseStatus { Status = "erro", Mensagem = ex.Message };
            }
        }

        // ---------------------------------------------------------------
        // ATIVAR LICENÇA (Webhook PHP chama isso internamente via REST)
        // Aqui no app usamos apenas para verificação. A escrita é feita
        // exclusivamente pelo webhook.php no servidor para segurança.
        // ---------------------------------------------------------------

        // ---------------------------------------------------------------
        // LISTENER EM TEMPO REAL (Long Polling)
        // Chama a verificação a cada N segundos e dispara callback quando ativo.
        // ---------------------------------------------------------------

        /// <summary>
        /// Inicia um loop de verificação periódica no Firebase.
        /// Quando o status mudar para "ativo", executa onLicenseActivated.
        /// Cancele via CancellationToken.
        /// </summary>
        public static async Task IniciarListenerAsync(
            string hwid,
            Action onLicenseActivated,
            CancellationToken cancellationToken,
            int intervaloDeSincMs = 4000)
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                try
                {
                    var status = await VerificarLicencaPorHwidAsync(hwid);

                    if (status.Status == "ativo")
                    {
                        onLicenseActivated.Invoke();
                        return; // Para o loop após ativar
                    }
                }
                catch (OperationCanceledException)
                {
                    return; // Cancelamento intencional — para o loop silenciosamente
                }
                catch { /* Ignora erros de rede temporários */ }

                try
                {
                    await Task.Delay(intervaloDeSincMs, cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    return;
                }
            }
        }

        // ---------------------------------------------------------------
        // HELPER: Lê campo string do documento Firestore
        // ---------------------------------------------------------------
        private static string GetStringField(JsonElement fields, string key)
        {
            try
            {
                if (fields.TryGetProperty(key, out var prop))
                {
                    if (prop.TryGetProperty("stringValue", out var val))
                        return val.GetString() ?? "";
                }
            }
            catch { }
            return "";
        }
    }

    // ---------------------------------------------------------------
    // MODELO DE STATUS DE LICENÇA
    // ---------------------------------------------------------------
    public class LicenseStatus
    {
        /// <summary>"ativo", "expirado", "nao_encontrado", "pendente_pagamento", "erro"</summary>
        public string Status { get; set; } = "nao_encontrado";
        public DateTime? DataExpiracao { get; set; }
        public string? Chave { get; set; }
        public string? Mensagem { get; set; }

        public bool EstaAtivo => Status == "ativo" && (DataExpiracao == null || DataExpiracao >= DateTime.Today);
    }
}
