export class AccessToken {
  constructor(public readonly value: string) {}

  toString() {
    return this.value;
  }
}
