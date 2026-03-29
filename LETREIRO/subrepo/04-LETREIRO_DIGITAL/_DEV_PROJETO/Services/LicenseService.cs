using System;
using System.Threading.Tasks;
using Firebase.Database;
using Firebase.Database.Query;
using LetreiroDigital.Models;

namespace LetreiroDigital.Services
{
    public class LicenseService
    {
        private const string FirebaseUrl = "https://letreirodigital-88f8e-default-rtdb.firebaseio.com/"; // Real Database URL
        
        public static async Task<string> ValidarLicenca(string chaveUsuario, string nomeResponsavel = "", string docResponsavel = "", string firebaseUrl = FirebaseUrl)
        {
            try
            {
                var hwidLocal = HardwareId.GetMotherboardSerial();
                var firebase = new FirebaseClient(firebaseUrl);
                
                // 1. Check if the license key exists in Firebase
                var licencaData = await firebase
                    .Child("licencas")
                    .Child(chaveUsuario)
                    .OnceSingleAsync<LicenseModel>();

                if (licencaData == null) 
                    return "Chave Inválida!";

                // 2. If HWID is not bound (First access), bind it.
                if (string.IsNullOrEmpty(licencaData.hwid_vinculado))
                {
                    await firebase
                        .Child("licencas")
                        .Child(chaveUsuario)
                        .PatchAsync(new { 
                            hwid_vinculado = hwidLocal, 
                            data_ativacao = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                            info_aparelho = HardwareId.GetMachineInfo(),
                            nome_proprietario = nomeResponsavel,
                            documento_identificado = docResponsavel,
                            aceite_lgpd = true
                        });
                    
                    return "Ativado com Sucesso!";
                }

                // 3. Se o HWID já está vinculado, verifica se é a mesma máquina
                if (licencaData.hwid_vinculado == hwidLocal)
                {
                    // Atualiza informações da máquina (info_aparelho sempre atualiza)
                    var updateData = new System.Dynamic.ExpandoObject() as System.Collections.Generic.IDictionary<string, object>;
                    updateData.Add("info_aparelho", HardwareId.GetMachineInfo());

                    // Só atualiza os dados do proprietário se eles forem passados (na ativação)
                    // Isso evita que a cada startup o app sobrescreva com vazio ""
                    if (!string.IsNullOrWhiteSpace(nomeResponsavel))
                        updateData.Add("nome_proprietario", nomeResponsavel);
                    
                    if (!string.IsNullOrWhiteSpace(docResponsavel))
                        updateData.Add("documento_identificado", docResponsavel);

                    _ = firebase.Child("licencas").Child(chaveUsuario).PatchAsync(updateData);
                    
                    return "Acesso Liberado";
                }
                else
                {
                    return "Erro: Esta chave já pertence a outro computador.";
                }
            }
            catch (Exception ex)
            {
                return $"Erro ao validar licença: {ex.Message}";
            }
        }
    }
}
