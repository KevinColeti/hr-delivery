import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  stats = [
    { label: 'Total de Produtos', value: 156, icon: '📦', color: 'bg-blue-500' },
    { label: 'Pedidos Hoje', value: 23, icon: '🛒', color: 'bg-green-500' },
    { label: 'Clientes Ativos', value: 89, icon: '👥', color: 'bg-purple-500' },
    { label: 'Faturamento (R$)', value: '12.450', icon: '💰', color: 'bg-yellow-500' },
  ];
}
