import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '', 
        loadComponent: ()=>import('./Features/Layout/layout-main/layout-main').then(m => m.LayoutMain), 
        children:[
            { 
                path: '', 
                loadComponent: () => import('./Features/Admin/dashboard/dashboard').then(m => m.Dashboard) 
            },
            { 
                path: 'dashboard', 
                loadComponent: () => import('./Features/Admin/dashboard/dashboard').then(m => m.Dashboard) 
            },
            { 
                path: 'data', 
                loadComponent: () => import('./Features/Admin/data/data').then(m => m.Data) 
            },
             { 
                path: 'expert', 
                loadComponent: () => import('./Features/Admin/systeme-expert/systeme-expert').then(m => m.SystemeExpert) 
            },
            { 
                path: 'prevision', 
                loadComponent: () => import('./Features/Admin/prevision/prevision').then(m => m.Prevision) 
            },
            { 
                path: 'graphique', 
                loadComponent: () => import('./Features/Admin/graphique/graphique').then(m => m.Graphique) 
            }
        ]
    }
];
