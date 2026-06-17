import { JoinForm } from '../molecules/JoinForm.js';

export class Menu {
  private messageEl: HTMLElement;
  private joinForm: JoinForm;

  constructor(
    private root: HTMLElement,
    formEl: HTMLFormElement,
    messageEl: HTMLElement,
    onPlay: (pseudo: string) => void,
  ) {
    this.messageEl = messageEl;
    this.joinForm = new JoinForm(formEl, onPlay);
  }

  show(message = ''): void {
    this.messageEl.textContent = message;
    this.root.hidden = false;
    this.joinForm.focus();
  }

  hide(): void {
    this.root.hidden = true;
  }
}
