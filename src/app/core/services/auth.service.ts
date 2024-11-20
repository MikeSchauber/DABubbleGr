import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';

import {
  getAuth,
  createUserWithEmailAndPassword,
  UserCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { addDoc, updateDoc } from 'firebase/firestore';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { InfoFlyerService } from './info-flyer.service';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private app = initializeApp(environment);
  auth = getAuth(this.app);
  user!: any;
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
  provider = new GoogleAuthProvider();
  registerFormFullfilled!: any;

  newUser!: User;

  constructor(private cloudService: CloudService, private router: Router, private flyerService: InfoFlyerService) {}

  async loginUser(loginForm: FormGroup) {
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.flyerService.infos.push("Sie wurden erfolgreich Angemeldet");
        this.user = userCredential.user;
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        console.error(error.message);
        this.passwordWrong = true;
      });
  }

  async loginGuestUser() {
    const email = 'guest@gmail.com';
    const password = '123test123';
    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        this.flyerService.infos.push("Sie wurden erfolgreich Angemeldet");
        this.user = userCredential.user;
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        console.log(error.message);
      });
  }

  async loginWithGoogle() {
    await signInWithPopup(this.auth, this.provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
        // IdP data available using getAdditionalUserInfo(result)
        this.router.navigate(['/dashboard']);
        this.passwordWrong = false;
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  }

  async createAndLoginUser() {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      this.registerFormFullfilled.email,
      this.registerFormFullfilled.password
    );
    this.user = userCredential.user;
    this.createNewUserForCollection(userCredential);
    await this.createMemberData();
  }

  createNewUserForCollection(userCredential: UserCredential) {
    const createdAt = new Date();
    this.newUser = new User(
      userCredential.user.email,
      userCredential.user.uid,
      this.registerFormFullfilled.name,
      true,
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
