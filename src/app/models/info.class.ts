export class Info {
  info: string = '';
  error: boolean = false;

  constructor(info: string, error: boolean) {
    this.info = info;
    this.error = error;
  }
}