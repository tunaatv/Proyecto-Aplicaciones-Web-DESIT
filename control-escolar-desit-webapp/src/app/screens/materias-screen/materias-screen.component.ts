import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { EliminarMateriaModalComponent } from 'src/app/modals/eliminar-materia-modal/eliminar-materia-modal.component';
import { FacadeService } from 'src/app/services/facade.service';
import { MateriasService } from 'src/app/services/materias.service';

@Component({
  selector: 'app-materias-screen',
  templateUrl: './materias-screen.component.html',
  styleUrls: ['./materias-screen.component.scss']
})
export class MateriasScreenComponent implements OnInit{

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_materias: any[] = [];

  //Para la tabla
  displayedColumns: string[] = [];
  //dataSource = new MatTableDataSource<DatosMateria>(this.lista_materias as DatosMateria[]);
  dataSource = new MatTableDataSource<DatosMateria>([]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  constructor(
    public facadeService: FacadeService,
    public materiasService: MateriasService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    //Validar que haya inicio de sesión
    //Obtengo el token del login
    this.token = this.facadeService.getSessionToken();
    console.log("Token: ", this.token);
    if(this.token == ""){
      this.router.navigate(["/"]);
    }

    //Columnas por rol
    if (this.rol === 'administrador') {
      this.displayedColumns = ['nrc', 'nombre', 'dias', 'horario', 'salon', 'maestro', 'editar', 'eliminar'];
    } else {
      // maestro y alumno: solo ve la info, sin acciones
      this.displayedColumns = ['nrc', 'nombre', 'dias', 'horario', 'salon', 'maestro'];
    }
    //Obtener materias
    this.obtenerMaterias();
  }

  // Consumimos el servicio para obtener las materias
  //Obtener materias
  public obtenerMaterias() {
    this.materiasService.obtenerListaMaterias().subscribe(
      (response) => {
        this.lista_materias = response || [];
        console.log("Lista materias: ", this.lista_materias);

        if (this.lista_materias.length > 0) {
          this.lista_materias.forEach((materia: any) => {
            if (Array.isArray(materia.dias_json)) {
              materia.dias = materia.dias_json.join(', ');
            } else {
              materia.dias_texto = '';
            }

            const inicio = this.formatearHora(materia.hora_inicio);
            const fin    = this.formatearHora(materia.hora_fin);
            materia.horario = `${inicio} - ${fin}`;
          });

          // Reemplazamos dataSource con la lista de materias
          this.dataSource.data = this.lista_materias as DatosMateria[];
        }
      },
      (error) => {
        console.error("Error al obtener la lista de materias: ", error);
        alert("No se pudo obtener la lista de materias");
      }
    );
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-materias/materias/" + idUser]);
  }

  public delete(idUser: number) {
    // Administrador puede eliminar cualquier materias
    const userId = Number(this.facadeService.getUserId());
    if (this.rol === 'administrador') {
      //Si es administrador, se puede eliminar
      const dialogRef = this.dialog.open(EliminarMateriaModalComponent,{
        data: {id: idUser, rol: 'administrador'}, //Se pasan valores a través del componente
        height: '288px',
        width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.isDelete){
        console.log("Materia eliminada");
        alert("Materia eliminada correctamente.");
        //Recargar página
        window.location.reload();
      }else{
        alert("Materia no se ha podido eliminar.");
        console.log("No se eliminó la materia");
      }
    });
    }else{
      alert("No tienes permisos para eliminar la materia.");
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // MatTableDataSource filter by default es case-sensitive, por eso normalizamos
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private formatearHora(hora: string | null | undefined): string {
    if (!hora) return '';
    const partes = hora.split(':');
    const hh = partes[0] || '00';
    const mm = partes[1] || '00';
    return `${hh}:${mm}`;
  }
}

export interface DatosMateria {
  id: number,
  nrc: number;
  nombre: string;
  dias_json: any;
  horario: string;
  salon: string,
  carrera: string,
  maestro: string,
  creditos: string,
}
