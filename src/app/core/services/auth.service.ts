import { Injectable } from '@angular/core';
import { CloudService } from './cloud.service';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { InfoFlyerService } from './info-flyer.service';
import { UserClass } from '../../models/user-class.class';
import {
  createUserWithEmailAndPassword,
  UserCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  deleteUser,
  Auth,
  sendEmailVerification,
} from '@angular/fire/auth';
import { addDoc, DocumentReference, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth!: Auth;
  currentUserData!: UserClass;
  currentUserId!: string;
  passwordWrong: boolean = false;
  registerNameValue: string = '';
  registerMailValue: string = '';
  registerPasswordValue: string = '';
  registerCheckbox: boolean = false;
  registerFormName: string = '';

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
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('beforeunload', this.handleWindowClose);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.changeOnlineStatus('away');
    } else {
      if (this.auth.currentUser) {
        this.changeOnlineStatus('online');
      }
    }
  };

  private handleWindowClose = async () => {
    if (this.auth.currentUser) {
      await this.changeOnlineStatus('offline');
    }
  };

  // Überprüfung ob ein User eingeloggt ist
  isLoggedIn(): boolean {
    if (this.auth.currentUser != null) {
      return true;
    } else {
      return false;
    }
  }

  async checkIfMemberExists() {
    const userId = await this.getCurrentUserId();
    if (userId.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  async changeOnlineStatus(status: string) {
    const userId = await this.getCurrentUserId();
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
    await this.createCurrentUserDataInLocalStorage(userId);
    this.loadCurrentUserDataFromLocalStorage();
  }

  async getCurrentUserId() {
    const userCollection = await this.cloudService.getCollection(
      'publicUserData'
    );
    const email = this.auth.currentUser?.email;
    for (const user of userCollection) {
      if (email === user.accountEmail) {
        return user.publicUserId;
      }
    }
    return '';
  }

  async createCurrentUserDataInLocalStorage(userId: string) {
    const userData = await this.cloudService.getQueryData(
      'publicUserData',
      'publicUserId',
      userId
    );
    if (userData.length > 0) {
      localStorage.setItem('currentUserData', JSON.stringify(userData[0]));
    } else {
      console.error('Benutzerdaten konnten nicht gefunden werden.');
    }
  }

  loadCurrentUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('currentUserData');
    if (userDataString) {
      this.currentUserData = JSON.parse(userDataString);
    } else {
      console.warn('Keine Benutzerdaten im localStorage gefunden.');
    }
  }

  async registerAndLoginUser(loginForm: FormGroup) {
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    const userExists = await this.checkIfMemberExists();
    this.registerFormName = loginForm.value.name;
    await createUserWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        if (!userExists) {
          this.createMemberData(userCredential);
          this.sendEmailVerification();
        }
        this.router.navigate(['/add-avatar']);
      })
      .catch((error) => {
        if (error.code == 'auth/email-already-in-use') {
          this.infoService.createInfo('Die Email ist schon vergeben', true);
        } else {
          this.infoService.createInfo(
            'Konto konnte nicht erstellt werden',
            false
          );
          console.log(error);
        }
      });
  }

  async sendEmailVerification() {
    if (this.auth.currentUser != null) {
      try {
        await sendEmailVerification(this.auth.currentUser);
        this.infoService.createInfo(
          'Verifizierungs E-mail wurde versendet',
          false
        );
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('kein current user gefunden');
    }
  }

  async loginGuestUser() {
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
  async loginWithPassword(loginForm: FormGroup) {
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

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userExists = await this.checkIfMemberExists();
    await signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        if (!userExists) {
          this.createMemberData(userCredential);
          this.sendEmailVerification();
        }
        this.router.navigate(['/dashboard']);
        this.infoService.createInfo('Anmeldung erfolgreich', false);
        this.changeOnlineStatus('online');
        this.passwordWrong = false;
      })
      .catch((error) => {
        console.error('Fehler bei der Google-Anmeldung:', error);
      });
  }

  async logoutCurrentUser() {
    await this.changeOnlineStatus('offline');
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich ausgeloggt', false);
    } catch (error) {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
  }

  async createMemberData(userCredential: UserCredential) {
    const user = this.newUserForCollection(userCredential);
    try {
      const docRef = await addDoc(
        this.cloudService.getRef('publicUserData'),
        user.toJson()
      );
      await this.updateUserNameAndId(docRef, user);
      this.infoService.createInfo('Konto erfolgreich erstellt', false);
      this.changeOnlineStatus('online');
    } catch (error) {
      this.deleteUserCall();
      this.infoService.createInfo('Konto erstellen fehlgeschlagen', true);
      console.error('Fehler beim Erstellen des Konto-Datensatzes' + error);
    }
  }

  async updateUserNameAndId(docRef: DocumentReference, user: UserClass) {
    const id = docRef.id;
    let name = this.getName(user);
    await updateDoc(docRef, {
      publicUserId: id,
      displayName: name,
    });
    this.registerFormName = '';
  }

  getName(user: UserClass) {
    if (this.registerFormName.length > 0) {
      return this.registerFormName;
    } else {
      return this.createPrettyNameFromEmail(user.accountEmail);
    }
  }

  createPrettyNameFromEmail(email: string | null): string {
    if (!email) {
      return 'Unbekannter Benutzer';
    }
    const emailParts = email.split('@');
    const username = emailParts[0] || '';
    let prettyName = username
      .replace(/[\.\_\-]/g, ' ')
      .replace(/\d+$/, '')
      .trim();
    prettyName = prettyName
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    return prettyName || 'Unbekannter Benutzer';
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

  async deleteUserCall() {
    if (this.auth.currentUser) {
      let userPar = this.auth.currentUser;
      deleteUser(userPar)
        .then(() => {
          console.log('user deleted');
        })
        .catch((error) => {
          console.error('Try to delete user: ' + error.message);
        });
    }
  }

  newUserForCollection(userCredential: UserCredential) {
    let email = this.userCredentialEmail(userCredential);
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

  userCredentialEmail(userCredential: UserCredential) {
    if (userCredential.user.email) {
      return userCredential.user.email;
    } else {
      return '';
    }
  }

  async updateEditInCloud(email: string, name: string, newAvatarUrl: string) {
    const userId = await this.getCurrentUserId();
    let updatePackage = this.returnUpdatePackage(email, name, newAvatarUrl);
    try {
      await updateDoc(
        this.cloudService.getSingleDoc('publicUserData', userId),
        updatePackage
      );
      await this.createCurrentUserDataInLocalStorage(userId);
      this.loadCurrentUserDataFromLocalStorage();
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Konto-Datensatzes');
    }
  }

  returnUpdatePackage(email: string, name: string, newAvatarUrl: string) {
    if (newAvatarUrl.length > 0) {
      return {
        displayEmail: email,
        displayName: name,
        avatarUrl: newAvatarUrl,
      };
    } else {
      return {
        displayEmail: email,
        displayName: name,
      };
    }
  }
}
