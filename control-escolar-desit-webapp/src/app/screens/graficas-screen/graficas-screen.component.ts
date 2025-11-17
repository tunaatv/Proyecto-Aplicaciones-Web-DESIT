import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-graficas-screen',
  templateUrl: './graficas-screen.component.html',
  styleUrls: ['./graficas-screen.component.scss']
})
export class GraficasScreenComponent implements OnInit, AfterViewInit {

  // Totales
  totalAdmins  = 0;
  totalMaestros = 0;
  totalAlumnos  = 0;

  // Para saber cuándo podemos dibujar
  private viewReady = false;
  private dataReady = false;

  // Referencias a los canvas
  @ViewChild('histCanvas') histCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')  barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas')  pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;

  // Instancias de Chart
  private histChart?: Chart;
  private barChart?: Chart;
  private pieChart?: Chart;
  private doughnutChart?: Chart;

  constructor(
    private adminService: AdministradoresService,
    private maestroService: MaestrosService,
    private alumnoService: AlumnosService
  ) {}

  ngOnInit(): void {
    this.cargarTotales();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryBuildCharts();
  }

  private cargarTotales(): void {
    forkJoin({
      admins:  this.adminService.obtenerListaAdmins(),
      maestros: this.maestroService.obtenerListaMaestros(),
      alumnos: this.alumnoService.obtenerListaAlumnos(),
    }).subscribe({
      next: (resp) => {
        this.totalAdmins   = resp.admins?.length   || 0;
        this.totalMaestros = resp.maestros?.length || 0;
        this.totalAlumnos  = resp.alumnos?.length  || 0;

        this.dataReady = true;
        this.tryBuildCharts();
      },
      error: (err) => {
        console.error('Error al cargar totales para gráficas', err);
      }
    });
  }

  private tryBuildCharts(): void {
    //Solo dibujar si ya tenemos vista y datos
    if (!this.viewReady || !this.dataReady) return;

    const labels = ['Administradores', 'Maestros', 'Alumnos'];
    const data   = [this.totalAdmins, this.totalMaestros, this.totalAlumnos];

    this.histChart?.destroy();
    this.barChart?.destroy();
    this.pieChart?.destroy();
    this.doughnutChart?.destroy();

    //Histograma
    this.histChart = new Chart(this.histCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Usuarios registrados',
          data,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
      }
    });

    //Barras
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Usuarios registrados',
          data,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });

    //circular
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });

    //Dona?
    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
}
