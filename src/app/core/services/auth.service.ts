import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environments';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app = initializeApp(environment);
  auth = getAuth(this.app);
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

  profileFormFullfilled!: any;

  constructor() {}

  async createUser() {
    console.log(this.auth, this.registerMailValue, this.registerPasswordValue);
    createUserWithEmailAndPassword(
      this.auth,
      this.registerMailValue,
      this.registerPasswordValue
    )
      .then((userCredential: any) => {
        const user = userCredential.user;
        console.log(user);
      })
      .catch((error: any) => {
        const errorCode = error.code;
        const errorMessage = error.message;
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
