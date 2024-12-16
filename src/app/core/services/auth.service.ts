import { AfterViewInit, Injectable, OnDestroy } from '@angular/core';
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

  constructor(
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService,

    auth: Auth
  ) {
    this.auth = auth;
    this.startAuthStateDetection();
  }

  /**
   * Starts the authentication state detection to navigate the user based on authentication status.
   * If a user is authenticated, it navigates to the dashboard. Otherwise, it navigates to the login page.
   */
  startAuthStateDetection() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Checks if the user is logged in by verifying the current user's authentication state.
   * @returns {boolean} True if the user is logged in, false otherwise.
   */
  isLoggedIn(): boolean {
    if (this.auth.currentUser != null) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Checks if the current user exists in the system by looking up their user ID.
   * @returns {Promise<boolean>} A promise that resolves to true if the user exists, otherwise false.
   */
  async checkIfMemberExists(): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (userId.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Changes the online status of the current user in the database.
   * Updates the status to the specified value and saves the data in localStorage.
   * @param {string} status The status to set for the user (e.g., 'online', 'offline').
   */
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
    await this.loadCurrentUserDataFromLocalStorage();
  }

  /**
   * Retrieves the current user's ID by matching their email address.
   * @returns {Promise<string>} A promise that resolves to the user's ID, or an empty string if not found.
   */
  async getCurrentUserId(): Promise<string> {
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

  /**
   * Creates and stores the current user's data in localStorage.
   * @param {string} userId The user ID of the current user.
   */
  async createCurrentUserDataInLocalStorage(userId: string) {
    const userData = await this.cloudService.getQueryData(
      'publicUserData',
      'publicUserId',
      userId
    );
    if (userData.length > 0) {
      localStorage.setItem('currentUserData', JSON.stringify(userData[0]));
    } else {
      console.error('User data could not be found.');
    }
  }

  /**
   * Loads the current user's data from localStorage and updates the local state.
   * If no data is found, a warning is displayed and the user is logged out.
   */
  async loadCurrentUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('currentUserData');
    if (userDataString) {
      this.currentUserData = JSON.parse(userDataString);
    } else {
      console.warn('No user data found in localStorage.');
      this.infoService.createInfo(
        'Es wurden keine Benutzerdaten gefunden',
        true
      );
      await this.logoutCurrentUser();
    }
  }

  /**
   * Registers and logs in the user with the provided login form data.
   * @param {FormGroup} loginForm The login form containing the user's email and password.
   */
  async registerAndLoginUser(loginForm: FormGroup) {
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    this.registerFormName = loginForm.value.name;
    await this.createUserAndLogin(email, password);
  }

  /**
   * Creates a new user with the specified email and password, then logs them in.
   * If the user does not exist, it will create new member data and send a verification email.
   * @param {string} email The user's email address.
   * @param {string} password The user's password.
   */
  async createUserAndLogin(email: string, password: string) {
    try {
      let userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const userExists = await this.checkIfMemberExists();
      if (!userExists) {
        this.createMemberData(userCredential);
        this.sendEmailVerification();
      } else {
        console.error('kein nutzer gefunden');
      }
      this.router.navigate(['/add-avatar']);
      this.infoService.createInfo('Konto erfolgreich erstellt', false);
    } catch {
      this.handleRegisterError(error);
      this.infoService.createInfo('Konto erstellen fehlgeschlagen', true);
    }
  }

  /**
   * Handles errors that occur during user registration.
   * @param {any} error The error returned during registration.
   */
  handleRegisterError(error: any) {
    if (error.code == 'auth/email-already-in-use') {
      this.infoService.createInfo('Die E-mail ist schon vergeben', true);
    } else {
      this.infoService.createInfo('Fehler beim erstellen des Kontos', false);
    }
    console.log(error);
  }

  /**
   * Sends a verification email to the current user.
   * Displays a success or failure message based on the result.
   */
  async sendEmailVerification() {
    if (this.auth.currentUser != null) {
      try {
        await sendEmailVerification(this.auth.currentUser);
        this.infoService.createInfo(
          'Verifizierungs E-mail wurde versendet',
          false
        );
      } catch (error) {
        this.infoService.createInfo(
          'Versenden der Verifizierungs E-mail fehlgeschlagen',
          true
        );
      }
    }
  }

  /**
   * Logs in a guest user with a predefined email and password.
   * Navigates to the dashboard if successful, or displays an error message.
   */
  async loginGuestUser() {
    const email = 'guest@gmail.com';
    const password = '123test123';
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.infoService.createInfo('Anmeldung erfolgreich', false);
      this.passwordWrong = false;
      await this.changeOnlineStatus('online');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      console.error('Error during guest login:', error);
    }
  }

  /**
   * Logs in a user with email and password from the provided form data.
   * @param {FormGroup} loginForm The login form containing the user's email and password.
   */
  async loginWithPassword(loginForm: FormGroup) {
    const email = loginForm.value.email;
    const password = loginForm.value.password;

    signInWithEmailAndPassword(this.auth, email, password)
      .then(async (userCredential) => {
        await this.handlePasswordLogin(userCredential);
      })
      .catch((error) => {
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
        this.passwordWrong = true;
        console.error('Login failed:', error);
      });
  }

  /**
   * Handles the login process after successfully authenticating with email and password.
   * @param {UserCredential} userCredential The user credentials returned after a successful login.
   */
  async handlePasswordLogin(userCredential: UserCredential) {
    const userExists = await this.checkIfMemberExists();
    if (!userExists) {
      this.createMemberData(userCredential);
      this.sendEmailVerification();
    }
    this.infoService.createInfo('Anmeldung erfolgreich', false);
    this.passwordWrong = false;
    await this.changeOnlineStatus('online');
    this.router.navigate(['/dashboard']);
  }

  /**
   * Logs in a user using Google authentication via a popup.
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider)
      .then((userCredential) => {
        this.handleLoginWidthPopup(userCredential);
      })
      .catch((error) => {
        console.error('Error during Google login:', error);
        this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      });
  }

  /**
   * Handles the login process after successfully authenticating via Google popup.
   * @param {UserCredential} userCredential The user credentials returned after successful Google login.
   */
  async handleLoginWidthPopup(userCredential: UserCredential) {
    const userExists = await this.checkIfMemberExists();
    if (!userExists) {
      this.createMemberData(userCredential);
      this.sendEmailVerification();
    }
    this.infoService.createInfo('Anmeldung erfolgreich', false);
    await this.changeOnlineStatus('online');
    this.passwordWrong = false;
    this.router.navigate(['/dashboard']);
  }

  /**
   * Logs out the current user and updates their online status to offline.
   */
  async logoutCurrentUser() {
    await this.changeOnlineStatus('offline');
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich abgemeldet', false);
    } catch (error) {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
  }

  /**
   * Creates new member data for the user and stores it in the database.
   * @param {UserCredential} userCredential The user credentials of the newly registered user.
   */
  async createMemberData(userCredential: UserCredential) {
    const user = this.newUserForCollection(userCredential);
    try {
      const docRef = await addDoc(
        this.cloudService.getRef('publicUserData'),
        user.toJson()
      );
      await this.updateUserNameAndId(docRef, user);
      this.infoService.createInfo('Konto erfolgreich erstellt', false);
      await this.changeOnlineStatus('online');
    } catch (error) {
      this.deleteUserCall();
      this.infoService.createInfo('Konto wurde nicht erstellt', true);
      console.error('Error creating account record' + error);
    }
  }

  /**
   * Updates the user's name and ID in the database after account creation.
   * @param {DocumentReference} docRef The document reference of the newly created user.
   * @param {UserClass} user The user object containing the updated data.
   */
  async updateUserNameAndId(docRef: DocumentReference, user: UserClass) {
    const id = docRef.id;
    let name = this.getName(user);
    await updateDoc(docRef, {
      publicUserId: id,
      displayName: name,
    });
    this.registerFormName = '';
  }

  /**
   * Retrieves the display name of the user. If no name is set, it generates one from the user's email address.
   * @param {UserClass} user The user object containing the user's data.
   * @returns {string} The display name of the user.
   */
  getName(user: UserClass) {
    if (this.registerFormName.length > 0) {
      return this.registerFormName;
    } else {
      return this.createPrettyNameFromEmail(user.accountEmail);
    }
  }

  /**
   * Creates a "pretty" name from the user's email by capitalizing the words and removing unnecessary parts.
   * @param {string} email The user's email address.
   * @returns {string} A properly formatted display name.
   */
  createPrettyNameFromEmail(email: string | null): string {
    if (!email) {
      return 'Unknown User';
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
    return prettyName || 'Unknown User';
  }

  /**
   * Sends a password reset email to the specified email address.
   * @param {FormGroup} forgotPasswordForm The form containing the email address to reset.
   */
  async resetPassword(forgotPasswordForm: FormGroup) {
    const email = forgotPasswordForm.value.email;
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        this.infoService.createInfo('Email wurde versendet', false);
      })
      .catch(() => {
        this.infoService.createInfo(
          'Email konnte nicht versendet werden',
          true
        );
      });
  }

  /**
   * Attempts to delete the current user from the system.
   * If the user is deleted successfully, a message is logged. Otherwise, the error is logged.
   */
  async deleteUserCall() {
    if (this.auth.currentUser) {
      let userPar = this.auth.currentUser;
      deleteUser(userPar)
        .then(() => {
          console.log('User deleted');
        })
        .catch((error) => {
          console.error('Try to delete user: ' + error.message);
        });
    }
  }

  /**
   * Creates a new user object for adding to the database.
   * @param {UserCredential} userCredential The user credentials of the new user.
   * @returns {UserClass} A new user object based on the credentials.
   */
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

  /**
   * Extracts the email from the user credentials.
   * @param {UserCredential} userCredential The user credentials.
   * @returns {string} The user's email address.
   */
  userCredentialEmail(userCredential: UserCredential) {
    if (userCredential.user.email) {
      return userCredential.user.email;
    } else {
      return '';
    }
  }

  /**
   * Updates the current user's data in the cloud with the new email, name, and avatar URL.
   * @param {string} email The new email address of the user.
   * @param {string} name The new display name of the user.
   * @param {string} newAvatarUrl The new avatar URL of the user.
   */
  async updateEditInCloud(email: string, name: string, newAvatarUrl: string) {
    const userId = await this.getCurrentUserId();
    let updatePackage = this.returnUpdatePackage(email, name, newAvatarUrl);
    try {
      await updateDoc(
        this.cloudService.getSingleDoc('publicUserData', userId),
        updatePackage
      );
      await this.createCurrentUserDataInLocalStorage(userId);
      await this.loadCurrentUserDataFromLocalStorage();
    } catch (error) {
      console.error('Error updating the account record');
    }
  }

  /**
   * Prepares the update package for updating user data in the cloud.
   * @param {string} email The email address of the user.
   * @param {string} name The display name of the user.
   * @param {string} newAvatarUrl The URL of the new avatar.
   * @returns {object} The update package to send to the database.
   */
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
