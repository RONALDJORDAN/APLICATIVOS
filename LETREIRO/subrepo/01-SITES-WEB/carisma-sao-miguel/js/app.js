import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

// ============================================================
// Firebase Config
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyDHLRbC_nF8VH1c9ASphLEX1e-fZVY14aI",
    authDomain: "letreirodigital-88f8e.firebaseapp.com",
    projectId: "letreirodigital-88f8e",
    storageBucket: "letreirodigital-88f8e.firebasestorage.app",
    messagingSenderId: "566621041979",
    appId: "1:566621041979:web:ddeb6b3c53596ad474b31e",
    measurementId: "G-TBLEE2GEK7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ============================================================
// Conta Administrativo Padrão do Sistema
// Para criar o admin: cadastre com e-mail adminsmc@carisma.com
// ============================================================
const ADMIN_EMAIL = "adminsmc@carisma.com";

// ============================================================
// AUTENTICAÇÃO
// ============================================================

/**
 * Cadastra um novo usuário no Firebase Auth e cria o perfil no Firestore.
 * Utilizado agora apenas para Admin e pela lógica de "Lazy Creation" de alunos aprovados.
 */
export async function registerUser(nome, email, telefone, senha, role = 'aluno') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), senha);
        const user = userCredential.user;

        // Se o e-mail for o admin padrão, força a role admin
        const finalRole = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : role;

        // Grava perfil no Firestore
        await setDoc(doc(db, "users", user.uid), {
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            telefone: telefone.trim(),
            role: finalRole,
            data_cadastro: new Date().toISOString()
        });

        return { success: true, role: finalRole, message: 'Cadastro realizado com sucesso!' };

    } catch (error) {
        console.error("[registerUser] Erro:", error.code, error.message);
        let msg = 'Erro ao realizar cadastro. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') msg = 'Este e-mail já está cadastrado. Tente fazer login.';
        if (error.code === 'auth/weak-password') msg = 'A senha deve ter pelo menos 6 caracteres.';
        if (error.code === 'auth/invalid-email') msg = 'E-mail inválido.';
        return { success: false, message: msg };
    }
}

// ============================================================
// INSCRIÇÕES
// ============================================================

export async function submitInscription(nome, sobrenome, dataNasc, telefone) {
    try {
        const dateParts = dataNasc.split('-'); // YYYY-MM-DD -> [YYYY, MM, DD]
        const ddmmyyyy = `${dateParts[2]}${dateParts[1]}${dateParts[0]}`;
        const cleanNome = nome.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const expectedLogin = `${cleanNome}${ddmmyyyy}`;

        await addDoc(collection(db, "inscriptions"), {
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            data_nascimento: dataNasc,
            telefone: telefone.trim(),
            expected_login: expectedLogin,
            expected_password: ddmmyyyy,
            status: 'pendente',
            data_solicitacao: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("[submitInscription] Erro:", error.code, error.message);
        return { success: false, message: 'Erro ao enviar solicitação.' };
    }
}

export async function getPendingInscriptions() {
    try {
        const q = query(collection(db, "inscriptions"), where("status", "==", "pendente"));
        const snap = await getDocs(q);
        const records = [];
        snap.forEach(d => records.push({ id: d.id, ...d.data() }));
        return records;
    } catch (error) {
        console.error("[getPendingInscriptions] Erro:", error);
        return [];
    }
}

export async function getApprovedInscriptions() {
    try {
        const q = query(collection(db, "inscriptions"), where("status", "==", "aprovado"));
        const snap = await getDocs(q);
        const records = [];
        snap.forEach(d => records.push({ id: d.id, ...d.data() }));
        return records;
    } catch (error) {
        console.error("[getApprovedInscriptions] Erro:", error);
        return [];
    }
}

export async function approveInscription(id) {
    try {
        await updateDoc(doc(db, "inscriptions", id), {
            status: 'aprovado',
            data_aprovacao: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("[approveInscription] Erro:", error);
        return { success: false, message: error.message };
    }
}

export async function rejectInscription(id) {
    try {
        await updateDoc(doc(db, "inscriptions", id), {
            status: 'recusado',
            data_rejeicao: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("[rejectInscription] Erro:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Faz login. Se não tiver '@', trata como aluno (adiciona @carisma.com).
 * Implementa Lazy Creation se a conta não existir mas a inscrição estiver aprovada.
 */
export async function loginUser(loginStr, senha) {
    let email = loginStr.trim().toLowerCase();
    const isStudent = !email.includes('@');
    if (isStudent) email = `${email}@carisma.com`;

    try {
        await signInWithEmailAndPassword(auth, email, senha);
        return { success: true };
    } catch (error) {
        // Tenta Lazy Creation se for aluno e a conta Auth não existir ainda
        if (isStudent && (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials')) {
            try {
                const q = query(
                    collection(db, "inscriptions"),
                    where("status", "==", "aprovado"),
                    where("expected_login", "==", loginStr.trim().toLowerCase())
                );
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const docData = snap.docs[0].data();
                    const docId = snap.docs[0].id;

                    if (senha === docData.expected_password) {
                        // Cria no Auth
                        const userCred = await createUserWithEmailAndPassword(auth, email, senha);
                        // Cria perfil no Firestore
                        await setDoc(doc(db, "users", userCred.user.uid), {
                            nome: `${docData.nome} ${docData.sobrenome}`,
                            email: email,
                            telefone: docData.telefone,
                            role: 'aluno',
                            data_cadastro: new Date().toISOString()
                        });
                        // Marca inscrição como concluída
                        await updateDoc(doc(db, "inscriptions", docId), { status: 'concluida' });

                        return { success: true };
                    } else {
                        return { success: false, message: 'Senha incorreta (utilize sua data de nascimento: DDMMAAAA).' };
                    }
                }
            } catch (err) {
                console.error("[LazyCreation] Erro:", err);
            }
        }

        console.error("[loginUser] Erro:", error.code, error.message);
        let msg = 'Login ou senha incorretos.';
        if (error.code === 'auth/user-not-found') msg = 'Nenhuma conta encontrada. Verifique se foi aprovado.';
        if (error.code === 'auth/wrong-password') msg = 'Senha incorreta.';
        if (error.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Aguarde um momento.';
        return { success: false, message: msg };
    }
}

/**
 * Faz logout e redireciona para a landing page.
 */
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (e) {
        console.error("[logoutUser]", e);
    }
    window.location.href = 'index.html';
}

/**
 * Monitora o estado de autenticação.
 * Ao detectar usuário logado, busca o perfil no Firestore e chama callback com o objeto user.
 * Ao deslogar, chama callback(null).
 */
export function monitorAuthState(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
            callback(null);
            return;
        }
        try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                callback({ id: firebaseUser.uid, ...docSnap.data() });
            } else {
                // Perfil não encontrado no Firestore: tratamento de segurança
                console.warn("[monitorAuthState] Perfil não encontrado no Firestore. UID:", firebaseUser.uid);
                // Tenta criar o perfil de emergência como aluno
                const fallbackData = {
                    nome: firebaseUser.displayName || 'Usuário',
                    email: firebaseUser.email,
                    telefone: '',
                    role: firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'aluno',
                    data_cadastro: new Date().toISOString()
                };
                try {
                    await setDoc(doc(db, "users", firebaseUser.uid), fallbackData);
                } catch (writeErr) {
                    console.error("[monitorAuthState] Falha ao criar perfil de fallback:", writeErr);
                }
                callback({ id: firebaseUser.uid, ...fallbackData });
            }
        } catch (err) {
            console.error("[monitorAuthState] Erro ao buscar perfil:", err.code, err.message);
            // Em caso de erro de permissão do Firestore, usa dados mínimos do Auth
            callback({
                id: firebaseUser.uid,
                nome: firebaseUser.displayName || 'Usuário',
                email: firebaseUser.email,
                telefone: '',
                role: firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'aluno',
            });
        }
    });
}

// ============================================================
// FIRESTORE – PRESENÇAS E STORAGE
// ============================================================

/**
 * Faz upload da foto de presença para o Storage
 */
export async function uploadAttendancePhoto(userId, file) {
    try {
        const timestamp = new Date().getTime();
        const storageRef = ref(storage, `users/${userId}/attendance_${timestamp}.jpg`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("[uploadAttendancePhoto] Erro:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Faz upload da foto de perfil do usuário para o Storage e atualiza o Firestore.
 */
export async function uploadUserProfilePhoto(userId, file) {
    try {
        const storageRef = ref(storage, `users/${userId}/profile.jpg`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Atualiza a foto no Firestore
        await updateDoc(doc(db, "users", userId), { photoURL: downloadURL });

        return { success: true, url: downloadURL };
    } catch (error) {
        console.error("[uploadUserProfilePhoto] Erro:", error);
        return { success: false, message: error.message };
    }
}

export async function registerAttendance(user, dateString, photoUrl = null) {
    try {
        const timeString = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        await addDoc(collection(db, "attendance"), {
            userId: user.id,
            userName: user.nome,
            date: dateString,
            time: timeString,
            photoUrl: photoUrl,
            className: 'Seminário Carisma – Aula Regular',
            timestamp: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        console.error("[registerAttendance] Erro:", error.code, error.message);
        return { success: false, message: error.message };
    }
}

export async function getUserAttendance(userId) {
    try {
        const q = query(collection(db, "attendance"), where("userId", "==", userId));
        const snap = await getDocs(q);
        const records = [];
        snap.forEach(d => records.push({ id: d.id, ...d.data() }));
        return records;
    } catch (error) {
        console.error("[getUserAttendance] Erro:", error.code, error.message);
        return [];
    }
}

export async function getAllAttendance() {
    try {
        const snap = await getDocs(collection(db, "attendance"));
        const records = [];
        snap.forEach(d => records.push({ id: d.id, ...d.data() }));
        return records;
    } catch (error) {
        console.error("[getAllAttendance] Erro:", error.code, error.message);
        return [];
    }
}

// ============================================================
// FIRESTORE – USUÁRIOS
// ============================================================

export async function getAllUsers() {
    try {
        const snap = await getDocs(collection(db, "users"));
        const users = [];
        snap.forEach(d => users.push({ id: d.id, ...d.data() }));
        return users;
    } catch (error) {
        console.error("[getAllUsers] Erro:", error.code, error.message);
        return [];
    }
}

/**
 * Atualiza o papel (role) de um usuário no Firestore.
 * @param {string} userId - UID do usuário
 * @param {string} newRole - 'admin' ou 'aluno'
 */
export async function updateUserRole(userId, newRole) {
    try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        return { success: true };
    } catch (error) {
        console.error("[updateUserRole] Erro:", error.code, error.message);
        return { success: false, message: error.message };
    }
}

// ------------------------------------------------------------
// GERENCIAMENTO DE CADASTROS (ADMIN)
// ------------------------------------------------------------

export async function updateStudentData(id, isPreAtivo, data) {
    try {
        const collectionName = isPreAtivo ? "inscriptions" : "users";
        await updateDoc(doc(db, collectionName, id), data);
        return { success: true };
    } catch (error) {
        console.error("[updateStudentData] Erro:", error);
        return { success: false, message: error.message };
    }
}

export async function deleteStudentData(id, isPreAtivo) {
    try {
        // Como não podemos apagar do Auth via Client SDK com facilidade,
        // excluímos do Firestore. O Firebase Rules e monitorAuthState 
        // bloquearão o acesso se não existir no Firestore.
        // Se for Inscrição Pendente as Regras podem barrar delete público,
        // mas o Admin logado tem acesso.
        const collectionName = isPreAtivo ? "inscriptions" : "users";
        await deleteDoc(doc(db, collectionName, id));
        return { success: true };
    } catch (error) {
        console.error("[deleteStudentData] Erro:", error);
        return { success: false, message: error.message };
    }
}

export async function resetStudentAuth(userId, nomeComplete, dataNasc, whatsapp) {
    try {
        // 1. Gera as novas credenciais
        const dateParts = dataNasc.split('-');
        const ddmmyyyy = `${dateParts[2]}${dateParts[1]}${dateParts[0]}`;
        const cleanNome = nomeComplete.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const expectedLogin = `${cleanNome}${ddmmyyyy}`;

        // 2. Cria a inscrição pré-aprovada
        await addDoc(collection(db, "inscriptions"), {
            nome: nomeComplete.trim(),
            sobrenome: "",
            data_nascimento: dataNasc,
            telefone: whatsapp.trim(),
            expected_login: expectedLogin,
            expected_password: ddmmyyyy,
            status: 'aprovado', // Já aprovada!
            data_solicitacao: new Date().toISOString(),
            data_aprovacao: new Date().toISOString(),
            isReset: true
        });

        // 3. Exclui o registro oficial (isso impede o login antigo de visualizar o dashboard)
        await deleteDoc(doc(db, "users", userId));

        return { success: true, login: expectedLogin, senha: ddmmyyyy };
    } catch (error) {
        console.error("[resetStudentAuth] Erro:", error);
        return { success: false, message: error.message };
    }
}
