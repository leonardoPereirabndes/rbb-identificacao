import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';

/* BNDES */
import { ValidacaoCadastroComponent } from './validacao-cadastro/validacao-cadastro.component';

/* Cliente */
import { AssociaContaClienteComponent } from './associa-conta-cliente/associa-conta-cliente.component';


/* Sociedade */
import { DashboardIdEmpresaComponent } from './dashboard-id-empresa/dashboard-id-empresa.component';
import {DashboardManualComponent } from './dashboard-manual/dashboard-manual.component';

const routes: Routes = [
  { path: 'bndes', component: HomeComponent },
  { path: 'cliente', component: HomeComponent },
  { path: 'doador', component: HomeComponent },
  { path: 'sociedade', component: HomeComponent },
  { path: 'bndes/val-cadastro', component: ValidacaoCadastroComponent},
  { path: 'cliente/associa-conta-cliente', component: AssociaContaClienteComponent },
  { path: 'sociedade/dash-empresas', component: DashboardIdEmpresaComponent },
  { path: 'sociedade/dash-manuais', component: DashboardManualComponent },
  { path: '', redirectTo: '/sociedade', pathMatch: 'full' },
];


@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
