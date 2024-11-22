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
import { addDoc, updateDoc } from 'firebase/firestore';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { InfoFlyerService } from './info-flyer.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app = getApp();
  auth = getAuth(this.app);
  passwordWrong: boolean = false;
  nameSvg = 'assets/icons/person.svg';
  mailSvg = 'assets/icons/mail.svg';
  passwordSvg = 'assets/icons/password.svg';
  placeholderName = 'Name und Nachname';
  placeholderMail = 'beispielname@email.com';
  placeholderPw = 'Passwort';
  placeholderPwConfirm = 'Neues Kennwort bestätigen';
  backArrowSvg = 'assets/icons/back-arrow.svg';
  flyerMessage: string = 'No information to display :)';
  registerNameClicked = false;
  registerEmailClicked = false;
  registerPasswordClicked = false;
  registerCheckboxClicked = false;
  registerNameValue: string = '';
  registerMailValue: string = '';
  registerPasswordValue: string = '';
  registerCheckbox: boolean = false; 
  registerFormFullfilled!: any;

  newUser!: User;

  // Mithilfe von: "this.auth.currentUser" kann abgefragt werden ob ein User eingelogt ist

  constructor(
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService
  ) {}

  async logoutCurrentUser() {
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich ausgeloggt', false);
    } catch {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
  }

  async resetPassword(forgotPasswordForm: FormGroup) {
    const email = forgotPasswordForm.value.email;
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.infoService.createInfo('E-Mail wurde versendet', false);
      })
      .catch((error) => {
        this.infoService.createInfo('Etwas ist fehlgeschlagen', true);
      });
  }

  async loginUser(loginForm: FormGroup) {
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
        this.passwordWrong = true;
      });
  }

  async loginGuestUser() {
    const email = 'guest@gmail.com';
    const password = '123test123';
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  async loginWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  }

  async createAndLoginUser() {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.registerFormFullfilled.email,
      this.registerFormFullfilled.password
    );
    this.createNewUserForCollection(userCredential);
    await this.createMemberData();
  }

  createNewUserForCollection(userCredential: UserCredential) {
    const createdAt = new Date();
    this.newUser = new User(
      userCredential.user.email,
      userCredential.user.uid,
      this.registerFormFullfilled.name,
      'active',
      'src/assets/basic-avatars/default-avatar.svg',
      createdAt,
      createdAt
    );
  }

  async createMemberData() {
    await addDoc(this.cloudService.getRef('members'), this.newUser.toJson());
  }

  async updateMemberAvatar(id: string, path: string) {
    await updateDoc(this.cloudService.getSingleRef('members', id), {
      avatarUrl: path,
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
