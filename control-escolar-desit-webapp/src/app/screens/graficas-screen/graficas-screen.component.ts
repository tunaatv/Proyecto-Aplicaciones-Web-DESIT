import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { MateriasService } from 'src/app/services/materias.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-graficas-screen',
  templateUrl: './graficas-screen.component.html',
  styleUrls: ['./graficas-screen.component.scss']
})
export class GraficasScreenComponent implements OnInit, AfterViewInit {

  //usuarios
  totalAdmins   = 0;
  totalMaestros = 0;
  totalAlumnos  = 0;

  //materias por día
  materiasPorDiaLabels: string[] = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes'
  ];
  materiasPorDiaData: number[] = [];

  //materias por carrera
  programasLabels: string[] = [];
  programasData: number[] = [];

  private viewReady = false;
  private dataReady = false;

  @ViewChild('histCanvas') histCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutCanvas') doughnutCanvas!: ElementRef<HTMLCanvasElement>;

  private histChart?: Chart;
  private barChart?: Chart;
  private pieChart?: Chart;
  private doughnutChart?: Chart;

  constructor(
    private adminService: AdministradoresService,
    private maestroService: MaestrosService,
    private alumnoService: AlumnosService,
    private materiasService: MateriasService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryBuildCharts();
  }

  private cargarDatos(): void {
    forkJoin({
      admins:   this.adminService.obtenerListaAdmins(),
      maestros: this.maestroService.obtenerListaMaestros(),
      alumnos:  this.alumnoService.obtenerListaAlumnos(),
      materias: this.materiasService.obtenerListaMaterias(),
    }).subscribe({
      next: (resp) => {
        this.totalAdmins   = resp.admins?.length   || 0;
        this.totalMaestros = resp.maestros?.length || 0;
        this.totalAlumnos  = resp.alumnos?.length  || 0;

        this.calcularMaterias(resp.materias || []);

        this.dataReady = true;
        this.tryBuildCharts();
      },
      error: (err) => {
        console.error('Error al cargar datos para gráficas', err);
      }
    });
  }

  private calcularMaterias(materias: any[]): void {
    const countsDias = new Array(this.materiasPorDiaLabels.length).fill(0);
    const countsProgramas: Record<string, number> = {};

    materias.forEach((mat: any) => {
      const diasStr: string = (mat.dias_json || mat.Dias || '').toString();
      const carreraStr: string = (mat.carrera || '').toString().trim();

      this.materiasPorDiaLabels.forEach((dia, index) => {
        if (diasStr.toLowerCase().includes(dia.toLowerCase())) {
          countsDias[index]++;
        }
      });

      if (carreraStr) {
        countsProgramas[carreraStr] = (countsProgramas[carreraStr] || 0) + 1;
      }
    });

    this.materiasPorDiaData = countsDias;
    this.programasLabels = Object.keys(countsProgramas);
    this.programasData   = this.programasLabels.map(lbl => countsProgramas[lbl]);
  }

  private tryBuildCharts(): void {
    if (!this.viewReady || !this.dataReady) return;

    const userLabels = ['Administradores', 'Maestros', 'Alumnos'];
    const userData   = [this.totalAdmins, this.totalMaestros, this.totalAlumnos];

    this.histChart?.destroy();
    this.barChart?.destroy();
    this.pieChart?.destroy();
    this.doughnutChart?.destroy();

    //materias por día
    this.histChart = new Chart(this.histCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.materiasPorDiaLabels,
        datasets: [{
          label: 'Materias por día',
          data: this.materiasPorDiaData,
          borderColor: '#F88406',
          backgroundColor: 'rgba(248, 132, 6, 0.25)',
          fill: true,
          tension: 0.25,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    });

    //materias por programa
    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.programasLabels,
        datasets: [{
          label: 'Materias por programa',
          data: this.programasData,
          backgroundColor: 'rgba(135, 206, 250, 0.6)',
          borderColor: 'rgba(135, 206, 250, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });

    //gráfica pie
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: userLabels,
        datasets: [{
          data: userData,
          backgroundColor: [
            '#FCFF44',
            '#F1C8F2',
            '#31E731'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });

    //dona?
    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: userLabels,
        datasets: [{
          data: userData,
          backgroundColor: [
            '#F88406',
            '#FCFF44',
            '#31E7E7'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
}
