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
  isRegistering = false;

  constructor(
    private cloudService: CloudService,
    private router: Router,
    private infoService: InfoFlyerService,

    auth: Auth
  ) {
    this.auth = auth;
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
    await this.createCurrentUserDataInLocalStorage();
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
  async createCurrentUserDataInLocalStorage() {
    try {
      let userId = await this.getCurrentUserId();
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
    } catch {
      console.error('Error loading current user data from localStorage.');
      return;
    }
  }

  /**
   * Loads the current user's data from localStorage and updates the local state.
   * If no data is found, a warning is displayed and the user is logged out.
   */
  async loadCurrentUserDataFromLocalStorage() {
    const userDataString = localStorage.getItem('currentUserData');
    if (userDataString !== null) {
      this.currentUserData = JSON.parse(userDataString);
    } else {
      console.warn('No user data found in localStorage.');
      this.infoService.createInfo(
        'Es wurden keine Benutzerdaten gefunden',
        true
      );
      if (this.isRegistering) {
        this.deleteUserCall();
      }
      await this.logoutCurrentUser();
    }
  }

  /**
   * Registers and logs in the user with the provided login form data.
   * @param {FormGroup} loginForm The login form containing the user's email and password.
   */
  async handleRegister(loginForm: FormGroup) {
    this.isRegistering = true;
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    this.registerFormName = loginForm.value.name;
    await this.createUserAndLogin(email, password);
    this.isRegistering = false;
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
      await this.executeRegisterProcess(userCredential);
      this.router.navigate(['/add-avatar']);
    } catch (error) {
      this.handleRegisterError(error);
    }
  }

  /**
   * Executes the registration process for the user.
   * This includes creating member data, storing user data in local storage,
   * loading current user data, and sending a verification email.
   * @param {UserCredential} userCredential The user's credential object returned after registration.
   * @returns {Promise<void>} Resolves when the registration process is successfully completed.
   */
  async executeRegisterProcess(userCredential: UserCredential): Promise<void> {
    try {
      await this.createMemberData(userCredential);
      await this.createCurrentUserDataInLocalStorage();
      await this.loadCurrentUserDataFromLocalStorage();
      await this.sendEmailVerification();
    } catch (error) {
      console.warn('Fehler beim Ausführen oder Erstellen des Nutzers', error);
      this.infoService.createInfo('Registrierung fehlgeschlagen', true);
      return;
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
    console.error(error);
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
    this.cloudService.loading = true;
    const email = 'guest@gmail.com';
    const password = '123test123';
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      await this.createCurrentUserDataInLocalStorage();
      await this.loadCurrentUserDataFromLocalStorage();
      this.infoService.createInfo('Anmeldung erfolgreich', false);
      this.passwordWrong = false;
      await this.changeOnlineStatus('online');
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      console.error('Error during guest login:', error);
    }
    this.cloudService.loading = false;
  }

  /**
   * Logs in a user with email and password from the provided form data.
   * @param {FormGroup} loginForm The login form containing the user's email and password.
   */
  async loginWithPassword(loginForm: FormGroup) {
    this.cloudService.loading = true;
    const email = loginForm.value.email;
    const password = loginForm.value.password;
    try {
      let userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      await this.handlePasswordLogin(userCredential);
      this.infoService.createInfo('Anmeldung erfolgreich', false);
    } catch (error) {
      this.infoService.createInfo('Anmeldung fehlgeschlagen', true);
      this.passwordWrong = true;
      console.error('Login failed:', error);
    }
    this.cloudService.loading = false;
  }

  /**
   * Handles the login process after successfully authenticating with email and password.
   * @param {UserCredential} userCredential The user credentials returned after a successful login.
   */
  async handlePasswordLogin(userCredential: UserCredential) {
    const userExists = await this.checkIfMemberExists();
    if (!userExists) {
      await this.createMemberData(userCredential);
      await this.sendEmailVerification();
    }
    await this.createCurrentUserDataInLocalStorage();
    await this.loadCurrentUserDataFromLocalStorage();
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
      await this.createMemberData(userCredential);
      await this.sendEmailVerification();
    }
    await this.createCurrentUserDataInLocalStorage();
    await this.loadCurrentUserDataFromLocalStorage();
    this.infoService.createInfo('Anmeldung erfolgreich', false);
    await this.changeOnlineStatus('online');
    this.passwordWrong = false;
    this.router.navigate(['/dashboard']);
  }

  /**
   * Logs out the current user and updates their online status to offline.
   */
  async logoutCurrentUser() {
    this.cloudService.loading = true;
    await this.changeOnlineStatus('offline');
    try {
      await this.auth.signOut();
      this.router.navigate(['/login']);
      this.infoService.createInfo('Sie wurden erfolgreich abgemeldet', false);
    } catch (error) {
      this.infoService.createInfo('Etwas ist schiefgelaufen', true);
    }
    this.cloudService.loading = false;
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
      await this.createCurrentUserDataInLocalStorage();
      this.infoService.createInfo('Konto erfolgreich erstellt', false);
    } catch (error) {
      this.infoService.createInfo('Konto erstellung fehlgeschlagen', true);
      throw new Error('Kontoerstellung fehlgeschlagen');
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
    this.cloudService.loading = true;
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
    this.cloudService.loading = false;
  }

  /**
   * Attempts to delete the current user from the system.
   * If the user is deleted successfully, a message is logged. Otherwise, the error is logged.
   */
  async deleteUserCall() {
    if (this.auth.currentUser) {
      let user = this.auth.currentUser;
      deleteUser(user)
        .then(() => {
          console.warn('User deleted');
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
  newUserForCollection(userCredential: UserCredential): UserClass {
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
  userCredentialEmail(userCredential: UserCredential): string {
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
    this.cloudService.loading = true;
    const userId = await this.getCurrentUserId();
    let updatePackage = this.returnUpdatePackage(email, name, newAvatarUrl);
    try {
      await updateDoc(
        this.cloudService.getSingleDoc('publicUserData', userId),
        updatePackage
      );
      await this.createCurrentUserDataInLocalStorage();
      await this.loadCurrentUserDataFromLocalStorage();
    } catch (error) {
      console.error('Error updating the account record');
    }
    this.cloudService.loading = false;
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
