import { Injectable } from '@angular/core';
import { getApp, initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  UserCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { InfoFlyerService } from './info-flyer.service';
import { addDoc, updateDoc } from 'firebase/firestore';
import { environment } from '../../../environments/environments';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // private app = initializeApp(environment);
  // auth = getAuth(this.app);
  currentUserData!: User;
  currentUserId!: string;
  passwordWrong: boolean = false;
  nameSvg = 'assets/icons/person.svg';
  mailSvg = 'assets/icons/mail.svg';
  passwordSvg = 'assets/icons/password.svg';
  placeholderName = 'Name und Nachname';
  placeholderMail = 'beispielname@email.com';
  placeholderPw = 'Passwort';
  placeholderPwConfirm = 'Neues Kennwort bestätigen';
  backArrowSvg = 'assets/icons/back-arrow.svg';
  registerNameClicked = false;
  registerEmailClicked = false;
  registerPasswordClicked = false;
  registerCheckboxClicked = false;
  registerNameValue: string = '';
  registerMailValue: string = '';
  registerPasswordValue: string = '';
  registerCheckbox: boolean = false;
  registerFormFullfilled!: any;

  // Mithilfe von: "this.auth.currentUser" kann abgefragt werden ob ein User eingeloggt ist

  constructor(
    public auth: Auth,
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService
  ) {}

  generateRandomUserKey(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let userKey = '';
    const keyLength = 8;
    for (let i = 0; i < keyLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      userKey += characters[randomIndex];
    }
    return userKey;
  }

  // Überprüfung ob ein User eingeloggt ist
  isLoggedIn(): boolean {
    return !!this.auth?.currentUser; // Null-Sicherheitsprüfung und Konvertierung in Boolean
  }

  checkIfMemberExists() {
    const userId = this.getCurrentUserId();
    if (userId.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  createCurrentUserData() {
    const userId = this.getCurrentUserId();
    this.currentUserData = this.cloudService.members.find(
      (member: User) => userId === member.publicUserId
    );
  }

  getCurrentUserId() {
    const email = this.auth.currentUser?.email;
    for (const member of this.cloudService.members) {
      if (email === member.accountEmail) {
        return member.publicUserId;
      }
    }
    return '';
  }

  async changeOnlineStatus(status: string) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return;
    } else {
      await updateDoc(this.cloudService.getSingleDoc('members', userId), {
        userStatus: status,
      });
      this.currentUserId = userId;
      this.createCurrentUserData();
    }
  }

  async logoutCurrentUser() {
    try {
      this.changeOnlineStatus('offline');
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich ausgeloggt', false);
    } catch {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
  }

  async resetPassword(forgotPasswordForm: FormGroup) {
    const email = forgotPasswordForm.value.email;
    await sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.infoService.createInfo('E-Mail wurde versendet', false);
      })
      .catch(() => {
        this.infoService.createInfo('Etwas ist fehlgeschlagen', true);
      });
  }

  async loginUser(loginForm: FormGroup) {
    this.changeOnlineStatus('offline');
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    await signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        this.router.navigate(['/dashboard']);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.passwordWrong = false;
        this.changeOnlineStatus('online');
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
        this.passwordWrong = true;
      });
  }

  async loginGuestUser() {
    this.changeOnlineStatus('offline');
    const email = 'guest@gmail.com';
    const password = '123test123';
    await signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        this.router.navigate(['/dashboard']);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.passwordWrong = false;
        this.changeOnlineStatus('online');
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  async loginWithGoogle() {
    this.changeOnlineStatus('offline');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        if (!this.checkIfMemberExists()) {
          this.createMemberData(userCredential);
        }
        this.changeOnlineStatus('online');
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  async createAndLoginUser() {
    this.changeOnlineStatus('offline');
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.registerFormFullfilled.email,
      this.registerFormFullfilled.password
    );
    await this.createMemberData(userCredential);
    this.changeOnlineStatus('online');
  }

  async createMemberData(userCredential: UserCredential) {
    const user = this.createNewUserForCollection(userCredential);
    const docRef = await addDoc(
      this.cloudService.getRef('members'),
      user.toJson()
    );
    await updateDoc(docRef, {
      publicUserId: docRef.id,
      displayName: this.registerFormFullfilled.name,
    });
  }

  createNewUserForCollection(currentUser: UserCredential) {
    const createdAt = new Date();
    let user = new User(
      currentUser.user.email,
      currentUser.user.email,
      currentUser.user.displayName,
      'online',
      'assets/basic-avatars/default-avatar.svg',
      createdAt,
      createdAt
    );
    return user;
  }

  async updateEditInCloud(email: string, name: string, userId: string) {
    await updateDoc(this.cloudService.getSingleDoc('members', userId), {
      displayEmail: email,
      displayName: name,
    });
  }

  focusNameInput() {
    this.nameSvg = 'assets/icons/person-bold.svg';
    this.placeholderName = '';
  }

  blurNameInput(component: string) {
    this.nameSvg = 'assets/icons/person.svg';
    this.placeholderName = 'Name und Nachname';
    if (component == 'register') {
      this.registerNameClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }
  focusMailInput() {
    this.mailSvg = 'assets/icons/mail-bold.svg';
    this.placeholderMail = '';
  }

  blurMailInput(component: string) {
    this.mailSvg = 'assets/icons/mail.svg';
    this.placeholderMail = 'beispielname@email.com';
    if (component == 'register') {
      this.registerEmailClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }

  focusPwInput() {
    this.passwordSvg = 'assets/icons/password-bold.svg';
    this.placeholderPw = '';
  }

  blurPwInput(component: string) {
    this.passwordSvg = 'assets/icons/password.svg';
    this.placeholderPw = 'Passwort';
    if (component == 'register') {
      this.registerPasswordClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }

  backArrowBlack() {
    setTimeout(() => {
      this.backArrowSvg = 'assets/icons/back-arrow.svg';
    }, 75);
  }

  backArrowPurple() {
    setTimeout(() => {
      this.backArrowSvg = 'assets/icons/back-arrow-purple.svg';
    }, 75);
  }
  toggleCheckbox(event: MouseEvent, checkbox: HTMLInputElement): void {
    if (event.target === checkbox) {
      return;
    }
    this.registerCheckboxClicked = true;
    checkbox.checked = checkbox.checked; // Toggle den Status der Checkbox
  }

  focusPwConfirmInput() {
    this.placeholderPwConfirm = '';
  }

  blurPwConfirmInput() {
    this.placeholderPwConfirm = 'Neues Kennwort bestätigen';
  }
}
