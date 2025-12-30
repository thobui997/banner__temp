import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Injectable()
export class GeneralInfomationFormService {
  private fb = inject(FormBuilder);
  private form!: FormGroup;

  createForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['']
    });

    return this.form;
  }

  getGeneralInfoFormValues(): { name: string; description: string } {
    return this.form.getRawValue();
  }

  invalidForm() {
    return this.form.invalid;
  }

  markAllAsTouched() {
    this.form.markAllAsTouched();
  }

  patchForm(data: { name: string; description: string }) {
    this.form.patchValue({
      name: data.name,
      description: data.description
    });
  }

  getForm() {
    return this.form;
  }

  markAsPristine() {
    this.form.markAsPristine();
  }
}
