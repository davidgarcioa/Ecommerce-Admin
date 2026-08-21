import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthSessionService } from '../../data-access/auth-session.service';

type AuthMode = 'login' | 'register';
type LoginControlName = 'email' | 'password';
type RegisterControlName = 'firstName' | 'lastName' | 'email' | 'password';

@Component({
  selector: 'app-auth-page',
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly mode = signal<AuthMode>('login');
  readonly displayedMode = signal<AuthMode>('login');
  readonly switchingMode = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly loginPasswordVisible = signal(false);
  readonly registerPasswordVisible = signal(false);
  readonly registerPasswordFocused = signal(false);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  setMode(mode: AuthMode): void {
    if (this.mode() === mode || this.loading()) {
      return;
    }

    this.mode.set(mode);
    this.error.set(null);
    this.success.set(null);
    this.switchingMode.set(true);
    window.setTimeout(() => {
      this.displayedMode.set(mode);
      this.switchingMode.set(false);
    }, 180);
  }

  toggleLoginPassword(): void {
    this.loginPasswordVisible.update((visible) => !visible);
  }

  toggleRegisterPassword(): void {
    this.registerPasswordVisible.update((visible) => !visible);
  }

  setRegisterPasswordFocus(focused: boolean): void {
    this.registerPasswordFocused.set(focused);
  }

  showRegisterPasswordHint(): boolean {
    const password = this.registerForm.controls.password;
    const hasValue = password.value.trim().length > 0;

    return (
      hasValue &&
      password.invalid &&
      (this.registerPasswordFocused() || password.touched || password.dirty)
    );
  }

  onLoginSubmit(event: Event): void {
    event.preventDefault();
    this.submitLogin();
  }

  onRegisterSubmit(event: Event): void {
    event.preventDefault();
    this.submitRegister();
  }

  updateLoginControl(controlName: LoginControlName, event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.loginForm.controls[controlName].setValue(target.value);
  }

  updateRegisterControl(controlName: RegisterControlName, event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.registerForm.controls[controlName].setValue(target.value);
  }

  markLoginControlTouched(controlName: LoginControlName): void {
    this.loginForm.controls[controlName].markAsTouched();
  }

  markRegisterControlTouched(controlName: RegisterControlName): void {
    this.registerForm.controls[controlName].markAsTouched();
  }

  controlError(form: AuthMode, controlName: string): string | null {
    const control = this.getControl(form, controlName);

    if (!control || (!control.touched && !control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return requiredMessage(controlName);
    }

    if (control.hasError('email')) {
      return 'Revisa que el correo esté escrito correctamente.';
    }

    if (control.hasError('minlength')) {
      return minLengthMessage(controlName);
    }

    return null;
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.loading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.authSession.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.complete('Ingresando a tu cuenta...'),
      error: (message: string) => this.fail(message),
    });
  }

  submitRegister(): void {
    if (this.registerForm.invalid || this.loading()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.authSession.register(this.registerForm.getRawValue()).subscribe({
      next: () => this.completeRegistration(),
      error: (message: string) => this.fail(message),
    });
  }

  private complete(message: string): void {
    this.success.set(message);
    window.setTimeout(() => {
      this.loading.set(false);
      void this.router.navigate(['/inicio']);
    }, 450);
  }

  private completeRegistration(): void {
    const email = this.registerForm.controls.email.value;

    this.loading.set(false);
    this.error.set(null);
    this.success.set('Te enviamos un correo de verificación. Confírmalo y luego inicia sesión.');
    this.loginForm.controls.email.setValue(email);
    this.loginForm.controls.password.reset();
    this.registerForm.reset();
    this.mode.set('login');
    this.displayedMode.set('login');
    this.switchingMode.set(false);
  }

  private fail(message: string): void {
    this.loading.set(false);
    this.error.set(message);
  }

  private getControl(form: AuthMode, controlName: string): AbstractControl | null {
    return form === 'login' ? this.loginForm.get(controlName) : this.registerForm.get(controlName);
  }
}

function requiredMessage(controlName: string): string {
  const messages: Record<string, string> = {
    email: 'Ingresa tu correo electrónico.',
    password: 'Ingresa tu contraseña.',
    firstName: 'Ingresa tu nombre.',
    lastName: 'Ingresa tu apellido.',
  };

  return messages[controlName] ?? 'Completa este campo.';
}

function minLengthMessage(controlName: string): string {
  const messages: Record<string, string> = {
    password: 'La contraseña no cumple con los requisitos mínimos.',
    firstName: 'El nombre debe tener al menos 2 caracteres.',
    lastName: 'El apellido debe tener al menos 2 caracteres.',
  };

  return messages[controlName] ?? 'El valor es demasiado corto.';
}
