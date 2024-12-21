import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthStyleService {
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

  constructor() {}

  /** Changes the SVG icon and placeholder text when the name input is focused. */
  focusNameInput() {
    this.nameSvg = 'assets/icons/person-bold.svg';
    this.placeholderName = '';
  }

  /** Changes the SVG icon, placeholder text, and sets a flag when the name input loses focus.
   * @param {string} component - The name of the component ('register' or 'login') triggering the blur event. */
  blurNameInput(component: string) {
    this.nameSvg = 'assets/icons/person.svg';
    this.placeholderName = 'Name und Nachname';
    if (component == 'register') {
      this.registerNameClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }

  /** Changes the SVG icon and placeholder text when the email input is focused. */
  focusMailInput() {
    this.mailSvg = 'assets/icons/mail-bold.svg';
    this.placeholderMail = '';
  }

  /** Changes the SVG icon, placeholder text, and sets a flag when the email input loses focus.
   * @param {string} component - The name of the component ('register' or 'login') triggering the blur event. */
  blurMailInput(component: string) {
    this.mailSvg = 'assets/icons/mail.svg';
    this.placeholderMail = 'beispielname@email.com';
    if (component == 'register') {
      this.registerEmailClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }

  /** Changes the SVG icon and placeholder text when the password input is focused. */
  focusPwInput() {
    this.passwordSvg = 'assets/icons/password-bold.svg';
    this.placeholderPw = '';
  }

  /** Changes the SVG icon, placeholder text, and sets a flag when the password input loses focus.
   * @param {string} component - The name of the component ('register' or 'login') triggering the blur event. */
  blurPwInput(component: string) {
    this.passwordSvg = 'assets/icons/password.svg';
    this.placeholderPw = 'Passwort';
    if (component == 'register') {
      this.registerPasswordClicked = true;
    } else if (component == 'login') {
    } else {
    }
  }

  /** Changes the back arrow icon to the default state after a small delay. */
  backArrowBlack() {
    setTimeout(() => {
      this.backArrowSvg = 'assets/icons/back-arrow.svg';
    }, 75);
  }

  /** Changes the back arrow icon to the purple state after a small delay. */
  backArrowPurple() {
    setTimeout(() => {
      this.backArrowSvg = 'assets/icons/back-arrow-purple.svg';
    }, 75);
  }

  /** Toggles the checkbox status when clicked outside the checkbox element.
   * @param {MouseEvent} event - The mouse event that triggered the action.
   * @param {HTMLInputElement} checkbox - The checkbox element being toggled. */
  toggleCheckbox(event: MouseEvent, checkbox: HTMLInputElement): void {
    if (event.target === checkbox) {
      return;
    }
    this.registerCheckboxClicked = true;
    checkbox.checked = checkbox.checked; // Toggle den Status der Checkbox
  }

  /** Clears the placeholder text when the password confirmation input is focused. */
  focusPwConfirmInput() {
    this.placeholderPwConfirm = '';
  }

  /** Resets the placeholder text when the password confirmation input loses focus. */
  blurPwConfirmInput() {
    this.placeholderPwConfirm = 'Neues Kennwort bestätigen';
  }
}
