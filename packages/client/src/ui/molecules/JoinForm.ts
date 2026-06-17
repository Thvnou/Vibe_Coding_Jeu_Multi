export class JoinForm {
  private input: HTMLInputElement;

  constructor(
    private form: HTMLFormElement,
    onSubmit: (pseudo: string) => void,
  ) {
    this.input = form.querySelector('input')!;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const pseudo = this.input.value.trim();
      if (pseudo.length === 0) return;
      onSubmit(pseudo);
    });
  }

  focus(): void {
    this.input.focus();
  }
}
