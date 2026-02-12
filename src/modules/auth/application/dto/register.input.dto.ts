export class RegisterInputDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
