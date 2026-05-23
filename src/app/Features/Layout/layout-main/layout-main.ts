import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { SidebarLayout } from "../sidebar-layout/sidebar-layout";

@Component({
  selector: 'app-layout-main',
  imports: [RouterOutlet, SidebarLayout],
  templateUrl: './layout-main.html',
  styleUrl: './layout-main.css',
})
export class LayoutMain {

}
