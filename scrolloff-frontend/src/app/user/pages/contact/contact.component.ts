import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
})
export class ContactComponent {
  submitted = false;

  onSubmit() {
    this.submitted = true;
    // TODO: Add backend API call to send contact form
    setTimeout(() => {
      this.submitted = false;
      alert('Thank you for your message! We will get back to you within 24 hours.');
    }, 2000);
  }
}
