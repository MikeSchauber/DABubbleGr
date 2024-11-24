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
} from 'firebase/auth'; 
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { InfoFlyerService } from './info-flyer.service';
import { addDoc, updateDoc } from 'firebase/firestore';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app = initializeApp(environment);
  auth = getAuth(this.app);
  currentUserData!: User;
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
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService
  ) {}

  checkLoginStatus() {
    if (this.auth.currentUser != null) {
      return true;
    } else {
      return false;
    }
  }

  // Überprüfung ob ein User eingeloggt ist
  isLoggedIn() {
    return this.auth.currentUser != null;
  }

  checkIfMemberExists(userCredential: UserCredential) {
    const userId = this.getCurrentUserId(userCredential);
    if (userId.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  createCurrentUserData() {
    for (const member of this.cloudService.members) {
      if (this.auth.currentUser?.uid === member.authId) {
        this.currentUserData = member;
        break;
      }
    }
  }

  getCurrentUserId(userCredential: UserCredential | null) {
    let userAuthId;
    if (userCredential === null && this.auth.currentUser != null) {
      userAuthId = this.auth.currentUser.uid;
    } else {
      userAuthId = userCredential?.user.uid;
    }
    const members = this.cloudService.members;
    for (const member of members) {
      if (userAuthId === member.authId) {
        return member.collectionId;
      }
    }
    return '';
  }

  async changeOnlineStatus(status: boolean) {
    const userId = this.getCurrentUserId(null);
    await updateDoc(this.cloudService.getSingleDoc('members', userId), {
      online: status,
    });
  }

  async logoutCurrentUser() {
    try {
      await this.changeOnlineStatus(false);
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
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    await signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        this.router.navigate(['/dashboard']);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.passwordWrong = false;
        this.changeOnlineStatus(true);
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
        this.passwordWrong = true;
      });
  }

  async loginGuestUser() {
    const email = 'guest@gmail.com';
    const password = '123test123';
    await signInWithEmailAndPassword(this.auth, email, password)
      .then(() => {
        this.router.navigate(['/dashboard']);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.passwordWrong = false;
        this.changeOnlineStatus(true);
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        if (!this.checkIfMemberExists(userCredential)) {
          this.createMemberData(userCredential);
        }
        this.changeOnlineStatus(true);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch(() => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  async createAndLoginUser() {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.registerFormFullfilled.email,
      this.registerFormFullfilled.password
    );
    await this.createMemberData(userCredential);
  }

  async createMemberData(userCredential: UserCredential) {
    const user = this.createNewUserForCollection(userCredential);
    await addDoc(this.cloudService.getRef('members'), user.toJson());
  }

  createNewUserForCollection(currentUser: UserCredential) {
    const createdAt = new Date();
    let user = new User(
      currentUser.user.email,
      currentUser.user.uid,
      currentUser.user.displayName,
      'active',
      true,
      'assets/basic-avatars/default-avatar.svg',
      createdAt,
      createdAt
    );
    return user;
  }

  async updateMemberAvatar(id: string, path: string) {
    // Holt die Referenz zum Mitglied basierend auf der ID
    const memberRef = this.cloudService.getSingleDoc('members', id);  
  
    // Aktualisiert das Avatar des Mitglieds
    await updateDoc(memberRef, {
      avatarUrl: path,  // Setzt den neuen Avatar-Pfad
    });
  
    console.log(`Avatar von Mitglied ${id} erfolgreich aktualisiert.`);
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
