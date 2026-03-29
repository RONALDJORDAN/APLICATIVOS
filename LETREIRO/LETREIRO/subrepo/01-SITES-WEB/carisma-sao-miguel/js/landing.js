import { submitInscription } from './app.js';

document.addEventListener('DOMContentLoaded', () => {

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');

    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (mobileNav.classList.contains('active')) {
            icon.classList.replace('ph-list', 'ph-x');
        } else {
            icon.classList.replace('ph-x', 'ph-list');
        }
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileNav.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuBtn.querySelector('i').classList.replace('ph-x', 'ph-list');
        });
    });

    // Handle Registration Form
    const formMatricula = document.getElementById('formMatricula');
    if (formMatricula) {
        formMatricula.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btnSubmit = formMatricula.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = 'Processando... <i class="ph ph-spinner ph-spin"></i>';

            const nome = document.getElementById('nome').value.trim();
            const sobrenome = document.getElementById('sobrenome').value.trim();
            const dataNasc = document.getElementById('data_nascimento').value;
            const telefone = document.getElementById('telefone').value.trim();

            const result = await submitInscription(nome, sobrenome, dataNasc, telefone);

            if (result.success) {
                formMatricula.innerHTML = `
                    <div style="text-align: center; color: var(--primary);">
                        <i class="ph ph-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Solicitação Enviada!</h3>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Sua inscrição foi recebida e está aguardando aprovação. Entraremos em contato via WhatsApp em breve.</p>
                        <a href="aluno.html" class="btn-primary" style="display: inline-block; margin-top: 1.5rem;">Ir para o Portal do Aluno</a>
                    </div>
                `;
            } else {
                alert(result.message);
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Enviar Solicitação <i class="ph ph-paper-plane-right"></i>';
            }
        });
    }

});
