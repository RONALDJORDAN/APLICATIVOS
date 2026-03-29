using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using LetreiroDigital.Services;

namespace LetreiroDigital.Views
{
    /// <summary>
    /// Tela de boas-vindas: seleção de plano → dados pessoais → pagamento → sucesso.
    /// </summary>
    public partial class WelcomeWindow : Window
    {
        // Plano selecionado: "MENSAL" ou "ANUAL"
        private string _planoSelecionado = "ANUAL";

        // HWID desta máquina — vincula a licença ao hardware
        private readonly string _hwid;

        // ID do pagamento gerado
        private string? _pagamentoId;

        // Controle do listener Firebase (cancela ao fechar a janela)
        private CancellationTokenSource? _listenerCts;

        public WelcomeWindow()
        {
            InitializeComponent();
            _hwid = HardwareId.GetMotherboardSerial();
            AtualizarSelecaoPlano();
        }

        protected override void OnClosed(EventArgs e)
        {
            _listenerCts?.Cancel();
            base.OnClosed(e);
        }

        // ------------------------------------------------------------------
        // ARRASTAR JANELA
        // ------------------------------------------------------------------
        private void TitleBar_MouseDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
                this.DragMove();
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            this.DialogResult = false;
            this.Close();
        }

        // ------------------------------------------------------------------
        // SELEÇÃO DE PLANO
        // ------------------------------------------------------------------
        private void CardMensal_Click(object sender, MouseButtonEventArgs e)
        {
            _planoSelecionado = "MENSAL";
            AtualizarSelecaoPlano();
        }

        private void CardAnual_Click(object sender, MouseButtonEventArgs e)
        {
            _planoSelecionado = "ANUAL";
            AtualizarSelecaoPlano();
        }

        private void AtualizarSelecaoPlano()
        {
            if (cardMensal == null) return;

            bool mensal = _planoSelecionado == "MENSAL";

            cardMensal.BorderBrush = mensal
                ? new SolidColorBrush(Color.FromRgb(59, 130, 246))
                : new SolidColorBrush(Color.FromRgb(45, 55, 72));

            cardAnual.BorderBrush = !mensal
                ? new SolidColorBrush(Color.FromRgb(245, 158, 11))
                : new SolidColorBrush(Color.FromRgb(45, 55, 72));

            radioMensal.Opacity = mensal ? 1 : 0.3;
            radioAnual.Opacity  = !mensal ? 1 : 0.3;
        }

        // ------------------------------------------------------------------
        // NAVEGAÇÃO — ETAPA 1 → ETAPA 2
        // ------------------------------------------------------------------
        private void BtnSeguirPlano_Click(object sender, RoutedEventArgs e)
        {
            // Atualiza o resumo do plano na tela de dados
            if (_planoSelecionado == "MENSAL")
                lblResumoPLano.Text = "Plano Mensal — R$ 29/mês";
            else
                lblResumoPLano.Text = "Plano Anual — R$ 249/ano";

            panelPlanos.Visibility = Visibility.Collapsed;
            panelDados.Visibility  = Visibility.Visible;
            OcultarStatus();
        }

        private void LinkVoltarPlano_Click(object sender, MouseButtonEventArgs e)
        {
            panelDados.Visibility  = Visibility.Collapsed;
            panelPlanos.Visibility = Visibility.Visible;
            OcultarStatus();
        }

        private void BtnVoltarParaPlanos_Click(object sender, RoutedEventArgs e)
        {
            panelDados.Visibility  = Visibility.Collapsed;
            panelPlanos.Visibility = Visibility.Visible;
            OcultarStatus();
        }

        // ------------------------------------------------------------------
        // NAVEGAÇÃO — ETAPA 2 → ETAPA 3 (valida dados pessoais)
        // ------------------------------------------------------------------
        private void BtnAvancar_Click(object sender, RoutedEventArgs e)
        {
            string nome    = txtNome.Text.Trim();
            string cpfCnpj = txtCpfCnpj.Text.Trim().Replace(".", "").Replace("-", "").Replace("/", "");
            string email   = txtEmail.Text.Trim();

            if (string.IsNullOrEmpty(nome))
            {
                MostrarStatus("⚠ Informe seu nome completo.", "#FBBF24");
                return;
            }
            if (string.IsNullOrEmpty(cpfCnpj) || (cpfCnpj.Length != 11 && cpfCnpj.Length != 14))
            {
                MostrarStatus("⚠ CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.", "#FBBF24");
                return;
            }
            if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            {
                MostrarStatus("⚠ E-mail inválido.", "#FBBF24");
                return;
            }

            // Avança imediatamente — a criação de cliente/assinatura ocorre no PHP
            panelDados.Visibility     = Visibility.Collapsed;
            panelCheckout.Visibility  = Visibility.Visible;
            OcultarStatus();

            // Inicia exibindo PIX por padrão
            BtnSelectPix_Click(null, null);
        }

        private void BtnVoltar_Click(object sender, RoutedEventArgs e)
        {
            // Cancela listener se estiver rodando
            _listenerCts?.Cancel();
            _listenerCts = null;

            panelCheckout.Visibility = Visibility.Collapsed;
            panelDados.Visibility    = Visibility.Visible;
            OcultarStatus();
        }

        // ------------------------------------------------------------------
        // SELEÇÃO DO MÉTODO DE PAGAMENTO
        // ------------------------------------------------------------------
        private void BtnSelectPix_Click(object? sender, RoutedEventArgs? e)
        {
            panelPix.Visibility  = Visibility.Visible;
            panelCard.Visibility = Visibility.Collapsed;

            btnSelectPix.Background  = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255));
            btnSelectCard.Background = Brushes.Transparent;

            GerarPix();
        }

        private void BtnSelectCard_Click(object? sender, RoutedEventArgs? e)
        {
            panelPix.Visibility  = Visibility.Collapsed;
            panelCard.Visibility = Visibility.Visible;

            btnSelectCard.Background = new SolidColorBrush(Color.FromArgb(40, 255, 255, 255));
            btnSelectPix.Background  = Brushes.Transparent;
        }

        // ------------------------------------------------------------------
        // LÓGICA PIX — chama PHP Bridge
        // ------------------------------------------------------------------
        private async void GerarPix()
        {
            // Cancela listener anterior se existir
            _listenerCts?.Cancel();

            try
            {
                lblPixStatus.Text = "⏳ Gerando QR Code PIX...";
                MostrarStatus("⏳ Aguardando conexão com o servidor...", "#60A5FA");

                string nome    = txtNome.Text.Trim();
                string cpfCnpj = txtCpfCnpj.Text.Trim().Replace(".", "").Replace("-", "").Replace("/", "");
                string email   = txtEmail.Text.Trim();
                string tel     = txtTelefone.Text.Trim();

                // Chama o PHP Bridge (API Key fica segura no servidor)
                var resp = await AsaasService.SolicitarPagamentoPixAsync(
                    hwid:     _hwid,
                    plano:    _planoSelecionado,
                    nome:     nome,
                    cpfCnpj:  cpfCnpj,
                    email:    email,
                    telefone: tel);

                if (resp != null && !string.IsNullOrEmpty(resp.QrCodeBase64))
                {
                    _pagamentoId        = resp.PaymentId;
                    imgQrCode.Source    = Base64ToImage(resp.QrCodeBase64);
                    txtPixCopy.Text     = resp.PixCopyPaste;
                    lblPixStatus.Text   = "✅ QR Code pronto!";
                    MostrarStatus("✅ Aguardando pagamento... será detectado automaticamente.", "#22C55E");

                    // Inicia listener: quando webhook ativar no Firebase, abre o sistema
                    IniciarListenerFirebase();
                }
                else
                {
                    lblPixStatus.Text = "⚠ QR Code indisponível.";
                    MostrarStatus("⚠ QR Code gerado, mas imagem não retornada. Use o link.", "#FBBF24");
                }
            }
            catch (Exception ex)
            {
                lblPixStatus.Text = "❌ Falha ao gerar PIX";
                MostrarStatus($"❌ {ex.Message}", "#F87171");
            }
        }

        private BitmapSource Base64ToImage(string base64String)
        {
            byte[] binaryData = Convert.FromBase64String(base64String);
            BitmapImage bi = new BitmapImage();
            bi.BeginInit();
            bi.StreamSource = new MemoryStream(binaryData);
            bi.EndInit();
            return bi;
        }

        private void BtnCopyPix_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrEmpty(txtPixCopy.Text))
            {
                Clipboard.SetText(txtPixCopy.Text);
                MostrarStatus("📋 Código PIX copiado!", "#22C55E");
            }
        }

        // ------------------------------------------------------------------
        // LÓGICA CARTÃO — também via PHP Bridge
        // ------------------------------------------------------------------
        private async void BtnPagarCard_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(txtCardHolder.Text) || string.IsNullOrEmpty(txtCardNumber.Text)
                || string.IsNullOrEmpty(txtCardMonth.Text) || string.IsNullOrEmpty(txtCardYear.Text)
                || string.IsNullOrEmpty(txtCardCvv.Text))
            {
                MostrarStatus("⚠ Preencha todos os dados do cartão.", "#FBBF24");
                return;
            }

            try
            {
                MostrarStatus("⏳ Processando pagamento...", "#60A5FA");

                string nome    = txtNome.Text.Trim();
                string cpfCnpj = txtCpfCnpj.Text.Trim().Replace(".", "").Replace("-", "").Replace("/", "");
                string email   = txtEmail.Text.Trim();
                string tel     = txtTelefone.Text.Trim();

                var resp = await AsaasService.SolicitarPagamentoPixAsync(
                    hwid:     _hwid,
                    plano:    _planoSelecionado,
                    nome:     nome,
                    cpfCnpj:  cpfCnpj,
                    email:    email,
                    telefone: tel);

                if (resp != null)
                {
                    _pagamentoId = resp.PaymentId;
                    MostrarStatus("⏳ Aguardando confirmação do pagamento...", "#60A5FA");
                    IniciarListenerFirebase();
                }
                else
                {
                    MostrarStatus("❌ Falha ao processar. Tente pelo PIX.", "#F87171");
                }
            }
            catch (Exception ex)
            {
                MostrarStatus($"❌ Erro: {ex.Message}", "#F87171");
            }
        }

        // ------------------------------------------------------------------
        // LISTENER FIREBASE EM TEMPO REAL
        // ------------------------------------------------------------------
        private void IniciarListenerFirebase()
        {
            _listenerCts?.Cancel();
            _listenerCts = new CancellationTokenSource();
            var cts = _listenerCts;

            _ = FirebaseService.IniciarListenerAsync(
                hwid: _hwid,
                onLicenseActivated: () =>
                {
                    Dispatcher.Invoke(async () =>
                    {
                        var license = await FirebaseService.VerificarLicencaPorHwidAsync(_hwid);
                        FinalizarComSucesso(license.Chave);
                    });
                },
                cancellationToken: cts.Token,
                intervaloDeSincMs: 4000);
        }

        private void FinalizarComSucesso(string? chaveLicenca = null)
        {
            _listenerCts?.Cancel();
            _pagamentoId = null;

            panelCheckout.Visibility = Visibility.Collapsed;
            panelSucesso.Visibility  = Visibility.Visible;
            OcultarStatus();

            txtChaveGerada.Text = chaveLicenca ?? "Verifique seu e-mail";
        }

        private void BtnConcluir_Click(object sender, RoutedEventArgs e)
        {
            if (!string.IsNullOrEmpty(txtChaveGerada.Text) && txtChaveGerada.Text != "Verifique seu e-mail")
                Clipboard.SetText(txtChaveGerada.Text);

            MessageBox.Show(
                "✅ Licença ativada!\n\nCole a chave na tela de ativação para começar.",
                "Sucesso", MessageBoxButton.OK, MessageBoxImage.Information);

            this.DialogResult = true;
            this.Close();
        }

        // ------------------------------------------------------------------
        // LINK "JÁ TENHO CHAVE"
        // ------------------------------------------------------------------
        private void LinkJaTenhChave_Click(object sender, MouseButtonEventArgs e)
        {
            this.DialogResult = false;
            this.Close();
        }

        // ------------------------------------------------------------------
        // HELPERS
        // ------------------------------------------------------------------
        private void MostrarStatus(string msg, string hexColor)
        {
            lblStatus.Text = msg;
            var brush = (Brush)new BrushConverter().ConvertFromString(hexColor)!;
            lblStatus.Foreground = brush;

            string bgHex = "#40000000";
            if (hexColor.Contains("FBBF24"))      bgHex = "#26FBBF24";
            else if (hexColor.Contains("F87171")) bgHex = "#26EF4444";
            else if (hexColor.Contains("22C55E")) bgHex = "#2622C55E";
            else if (hexColor.Contains("60A5FA")) bgHex = "#263B82F6";

            borderStatus.Background = (Brush)new BrushConverter().ConvertFromString(bgHex)!;
            borderStatus.Visibility = Visibility.Visible;
        }

        private void OcultarStatus()
        {
            lblStatus.Text = "";
            borderStatus.Visibility = Visibility.Collapsed;
        }
    }
}
