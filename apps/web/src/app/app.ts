import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: [':host { display: block; }']
})
export class App {
  protected title = 'نظام إدارة الكهرباء';
}
