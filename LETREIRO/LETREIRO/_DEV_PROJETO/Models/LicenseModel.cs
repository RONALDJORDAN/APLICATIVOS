using System;

namespace LetreiroDigital.Models
{
    public class LicenseModel
    {
        public string hwid_vinculado { get; set; } = string.Empty;
        public string data_ativacao { get; set; } = string.Empty;
        public string data_expiracao { get; set; } = string.Empty;
        public string data_inicio { get; set; } = string.Empty;
        public string status { get; set; } = string.Empty;
        public string nome_proprietario { get; set; } = string.Empty;
        public string documento_identificado { get; set; } = string.Empty;
        public bool aceite_lgpd { get; set; }
        public object? info_aparelho { get; set; }
    }
}
