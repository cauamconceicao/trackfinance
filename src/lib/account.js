import {
  deleteUser, EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, reauthenticateWithPopup,
  sendEmailVerification, updatePassword,
} from "firebase/auth"
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore"
import { auth, db, googleProvider } from "../firebase"

export function isGoogleUser(firebaseUser = auth.currentUser) {
  return Boolean(firebaseUser?.providerData.some((p) => p.providerId === "google.com"))
}

export async function deleteCollectionForUser(name, userId) {
  const snapshot = await getDocs(query(collection(db, name), where("userId", "==", userId)))
  const docs = snapshot.docs
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db)
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  return docs.length
}

// LGPD: apaga todos os dados e a própria conta de login
export async function deleteAccountAndData(password) {
  const user = auth.currentUser
  if (!user) throw new Error("not-signed-in")

  // O Firebase exige login recente para excluir a conta
  if (isGoogleUser(user)) {
    await reauthenticateWithPopup(user, googleProvider)
  } else {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  }

  for (const name of ["transactions", "goals", "recurring"]) {
    await deleteCollectionForUser(name, user.uid)
  }
  await deleteDoc(doc(db, "userSettings", user.uid)).catch(() => {})
  await deleteUser(user)
}

export function authErrorMessage(err) {
  switch (err?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "A janela de login foi fechada antes de terminar."
    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login. Permita pop-ups e tente de novo."
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "E-mail ou senha incorretos."
    case "auth/user-mismatch":
      return "Entre com a mesma conta que você está usando agora."
    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail."
    case "auth/email-already-in-use":
      return "Já existe uma conta com esse e-mail. Tente entrar."
    case "auth/provider-already-linked":
      return "Sua conta já tem uma senha. Use a opção de alterar."
    case "auth/credential-already-in-use":
      return "Esse e-mail já está em uso por outra conta."
    case "auth/requires-recent-login":
      return "Por segurança, saia e entre de novo antes de continuar."
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres."
    case "auth/invalid-email":
      return "Esse e-mail não parece válido."
    case "auth/too-many-requests":
      return "Muitas tentativas. Espere alguns minutos e tente de novo."
    case "auth/network-request-failed":
      return "Sem conexão com a internet."
    case "auth/operation-not-allowed":
      return "Login por e-mail ainda não está ativado neste app."
    case "auth/unauthorized-domain":
      return "Este endereço do site ainda não está autorizado no Firebase."
    default:
      return "Algo deu errado. Tente de novo."
  }
}

// Depois de clicar no link de confirmação, a pessoa vê o botão "Continuar" de volta para o app
export function verificationSettings() {
  return { url: `${window.location.origin}/`, handleCodeInApp: false }
}

// Envia o link de confirmação; se o domínio não estiver autorizado para o retorno, envia sem ele
export async function sendVerification(user = auth.currentUser) {
  try {
    await sendEmailVerification(user, verificationSettings())
  } catch (err) {
    if (err?.code === "auth/unauthorized-continue-uri" || err?.code === "auth/invalid-continue-uri") {
      await sendEmailVerification(user)
    } else {
      throw err
    }
  }
}

export function hasPassword(firebaseUser = auth.currentUser) {
  return Boolean(firebaseUser?.providerData.some((p) => p.providerId === "password"))
}

// Cria uma senha para quem entrou com o Google (vincula e-mail/senha à mesma conta)
// ou troca a senha de quem já tem uma
export async function savePassword({ currentPassword, newPassword }) {
  const user = auth.currentUser
  if (!user) throw new Error("not-signed-in")

  if (hasPassword(user)) {
    // Trocar a senha exige confirmar a senha atual
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword))
    await updatePassword(user, newPassword)
  } else {
    const credential = EmailAuthProvider.credential(user.email, newPassword)
    try {
      await linkWithCredential(user, credential)
    } catch (err) {
      // Login antigo demais: confirma com o Google e tenta de novo
      if (err?.code !== "auth/requires-recent-login") throw err
      await reauthenticateWithPopup(user, googleProvider)
      await linkWithCredential(user, credential)
    }
  }
  // Renova o token para o app perceber a mudança (o App escuta onIdTokenChanged)
  await user.getIdToken(true)
}
