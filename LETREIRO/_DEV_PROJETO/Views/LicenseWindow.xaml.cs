using System;
using System.Windows;
using LetreiroDigital.Services;

namespace LetreiroDigital.Views
{
    public partial class LicenseWindow : Window
    {
        public string LicenseKey { get; private set; } = "";

        public LicenseWindow()
        {
            InitializeComponent();
        }

        private async void BtnAtivar_Click(object sender, RoutedEventArgs e)
        {
            string nome = txtNome.Text.Trim();
            string documento = txtDocumento.Text.Trim();
            string key = txtChave.Text.Trim();

            if (string.IsNullOrEmpty(nome))
            {
                lblStatus.Text = "Por favor, informe seu nome completo.";
                return;
            }

            if (string.IsNullOrEmpty(documento))
            {
                lblStatus.Text = "Por favor, informe seu RG ou CPF.";
                return;
            }

            if (string.IsNullOrEmpty(key))
            {
                lblStatus.Text = "Por favor, insira uma chave válida.";
                return;
            }

            if (chkLGPD.IsChecked != true)
            {
                lblStatus.Text = "Você precisa aceitar os termos da LGPD para continuar.";
                return;
            }

            lblStatus.Text = "Validando dados e chave...";
            lblStatus.Foreground = System.Windows.Media.Brushes.Yellow;
            this.IsEnabled = false;

            try
            {
                // Validate via Service
                string result = await LicenseService.ValidarLicenca(key, nome, documento);

                if (result == "Ativado com Sucesso!" || result == "Acesso Liberado")
                {
                    LicenseKey = key;
                    this.DialogResult = true;
                    this.Close();
                }
                else
                {
                    lblStatus.Text = result;
                    lblStatus.Foreground = System.Windows.Media.Brushes.Red;
                }
            }
            catch (Exception ex)
            {
                lblStatus.Text = $"Erro de conexão: {ex.Message}";
                lblStatus.Foreground = System.Windows.Media.Brushes.Red;
            }
            finally
            {
                this.IsEnabled = true;
            }
        }

        private void BtnSair_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
            this.Close();
        }

        private void BtnObterChave_Click(object sender, RoutedEventArgs e)
        {
            // Abre a tela de boas-vindas com planos e pagamento
            var welcome = new WelcomeWindow();
            welcome.ShowDialog();
            // Após retornar da WelcomeWindow o usuário pode inserir a chave aqui
            txtChave.Focus();
        }
    }
}
