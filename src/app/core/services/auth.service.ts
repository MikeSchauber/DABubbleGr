import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  UserCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
} from 'firebase/auth';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { InfoFlyerService } from './info-flyer.service';
import { UserClass } from '../../models/user-class.class';
import { Auth } from '@angular/fire/auth';
import { addDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth!: Auth;
  currentUserData!: UserClass;
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
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService,
    auth: Auth
  ) {
    this.auth = auth;
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Auth State Changed');
        this.loadCurrentUserDataFromLocalStorage();
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // Überprüfung ob ein User eingeloggt ist
  isLoggedIn(): boolean {
    if (this.auth.currentUser != null) {
      console.log('online');
      return true;
    } else {
      return false;
    }
  }

  checkIfMemberExists() {
    const userId = this.getCurrentUserId();
    if (userId.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  async createCurrentUserData(userId: string) {
    const userData = this.cloudService.publicUserData.find(
      (user: UserClass) => user.publicUserId === userId
    );
    if (userData) {
      localStorage.setItem('currentUserData', JSON.stringify(userData));
    } else {
      console.error('Benutzerdaten konnten nicht gefunden werden.');
    }
  }

  loadCurrentUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('currentUserData');
    if (userDataString) {
      try {
        this.currentUserData = JSON.parse(userDataString);
      } catch (error) {
        console.error(
          'Fehler beim Parsen der Benutzerdaten aus dem localStorage:',
          error
        );
      }
    } else {
      console.warn('Keine Benutzerdaten im localStorage gefunden.');
    }
  }

  getCurrentUserId() {
    const email = this.auth.currentUser?.email;
    for (const user of this.cloudService.publicUserData) {
      if (email === user.accountEmail) {
        return user.publicUserId;
      }
    }
    return '';
  }

  async changeOnlineStatus(status: string) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return;
    } else {
      await updateDoc(
        this.cloudService.getSingleDoc('publicUserData', userId),
        {
          userStatus: status,
        }
      );
    }
    this.createCurrentUserData(userId);
  }

  async logoutCurrentUser() {
    this.changeOnlineStatus('offline');
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich ausgeloggt', false);
    } catch (error) {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
  }

  async resetPassword(forgotPasswordForm: FormGroup) {
    const email = forgotPasswordForm.value.email;
    sendPasswordResetEmail(this.auth, email)
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
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Anmeldung erfolgreich', false);
      this.passwordWrong = false;
      this.changeOnlineStatus('online');
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      this.passwordWrong = true;
    }
  }

  async loginGuestUser() {
    this.changeOnlineStatus('offline');
    const email = 'guest@gmail.com';
    const password = '123test123';

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/dashboard']);
      this.infoService.createInfo('Anmeldung erfolgreich', false);
      this.passwordWrong = false;
      this.changeOnlineStatus('online');
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      console.error('Fehler beim Gast-Login:', error);
    }
  }

  async loginWithGoogle() {
    this.changeOnlineStatus('offline');
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(this.auth, provider);
      console.log("hello");
      
      if (!this.checkIfMemberExists()) {
        this.createMemberData(userCredential);
      }
      this.changeOnlineStatus('online');
      this.infoService.createInfo('Anmeldung erfolgreich', false);
      this.router.navigate(['/dashboard']);
      this.passwordWrong = false;
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      console.error('Fehler bei der Google-Anmeldung:', error);
    }
  }

  async createAndLoginUser() {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.registerFormFullfilled.email,
        this.registerFormFullfilled.password
      );
      console.log(userCredential);
      this.createMemberData(userCredential);
      this.changeOnlineStatus('online');
      this.router.navigate(['/add-avatar']);
    } catch (error) {
      console.error(error);
    }
  }

  async createMemberData(userCredential: UserCredential) {
    const user = this.createNewUserForCollection(userCredential);
    try {
      const docRef = await addDoc(
        this.cloudService.getRef('publicUserData'),
        user.toJson()
      );
      this.currentUserData = user;
      this.currentUserData.publicUserId = docRef.id;
      this.currentUserData.displayName = this.registerFormFullfilled.name;
      await updateDoc(docRef, {
        publicUserId: docRef.id,
        displayName: this.registerFormFullfilled.name,
      });
      this.infoService.createInfo('Konto erfolgreich erstellt', false);
    } catch (error) {
      this.deleteUserCall();
      this.infoService.createInfo('Konto erstellen fehlgeschlagen', true);
      console.error('Fehler beim Erstellen des Konto-Datensatzes' + error);
    }
  }

  async deleteUserCall() {
    if (this.auth.currentUser) {
      let userPar = this.auth.currentUser;
      deleteUser(userPar)
        .then(() => {
          console.log('user deleted');
        })
        .catch((error) => {
          console.log('user still there');
        });
    }
  }

  createNewUserForCollection(userCredential: UserCredential) {
    const email = userCredential.user.email;
    const createdAt = new Date();
    let user = new UserClass(
      email,
      email,
      '',
      'online',
      'assets/basic-avatars/default-avatar.svg',
      createdAt,
      createdAt,
      ''
    );
    return user;
  }

  async updateEditInCloud(email: string, name: string, userId: string) {
    await updateDoc(this.cloudService.getSingleDoc('publicUserData', userId), {
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
