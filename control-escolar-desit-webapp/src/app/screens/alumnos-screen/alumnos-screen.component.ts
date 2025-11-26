import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';
import { FacadeService } from 'src/app/services/facade.service';
import { AlumnosService } from 'src/app/services/alumnos.service';

@Component({
  selector: 'app-alumnos-screen',
  templateUrl: './alumnos-screen.component.html',
  styleUrls: ['./alumnos-screen.component.scss']
})

export class AlumnosScreenComponent implements OnInit{
  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_alumnos: any[] = [];

  //Para la tabla
  //displayedColumns: string[] = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'edad', 'editar', 'eliminar'];
  displayedColumns: string[] = [];
  //dataSource = new MatTableDataSource<DatosUsuario>(this.lista_alumnos as DatosUsuario[]);
  dataSource = new MatTableDataSource<DatosUsuario>([]);


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    public facadeService: FacadeService,
    public alumnosService: AlumnosService,
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
      this.displayedColumns = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'edad', 'editar', 'eliminar'];
    } else {
      // maestro y alumno: solo ve la info, sin acciones
      this.displayedColumns = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'edad'];
    }
    //Obtener alumnos
    this.obtenerAlumnos();
  }

  ngAfterViewInit() {
    // Asignar paginator y sort después
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // sortingDataAccessor: controla cómo se extrae el valor a ordenar por cada columna
    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'id':
          // usa id numérico
          return item.id ?? 0;
        case 'matricula':
          // si matricula es string o número
          return (item.matricula ?? '').toString().toLowerCase();
        case 'nombre':
          // ordenar por nombre
          return (item.first_name ?? '').toString().toLowerCase();
        case 'apellidos':
          // ordenar por apellidos
          return (item.last_name ?? '').toString().toLowerCase();
        case 'fecha_nacimiento':
          // devolver timestamp para ordenar por fecha correctamente
          return item.fecha_nacimiento ? new Date(item.fecha_nacimiento).getTime() : 0;
        default:
          // fallback: string combinada de todas las propiedades (útil para otros ordenamientos)
          return (JSON.stringify(item) ?? '').toLowerCase();
      }
    };
  }

  // Consumimos el servicio para obtener los alumnos
  //Obtener alumnos
  public obtenerAlumnos() {
    this.alumnosService.obtenerListaAlumnos().subscribe(
      (response) => {
        this.lista_alumnos = response;
        console.log("Lista users: ", this.lista_alumnos);
        if (this.lista_alumnos.length > 0) {
          //Agregar datos del nombre e email
          this.lista_alumnos.forEach(usuario => {
            usuario.first_name = usuario.user.first_name;
            usuario.last_name = usuario.user.last_name;
            usuario.email = usuario.user.email;
          });
          console.log("Alumnos: ", this.lista_alumnos);

          //Reemplazamos dataSource
          this.dataSource.data = this.lista_alumnos as DatosUsuario[];
        }
      }, (error) => {
        console.error("Error al obtener la lista de alumnoss: ", error);
        alert("No se pudo obtener la lista de alumnos");
      }
    );
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/alumnos/" + idUser]);
  }

  public delete(idUser: number) {
    // Administrador puede eliminar cualquier alumno
    // Alumno solo puede eliminar su propio registro
    const userId = Number(this.facadeService.getUserId());
    if (this.rol === 'administrador' || (this.rol === 'alumno' && userId === idUser)) {
      //Si es administrador o es alumno, es decir, cumple la condición, se puede eliminar
      const dialogRef = this.dialog.open(EliminarUserModalComponent,{
        data: {id: idUser, rol: 'alumno'}, //Se pasan valores a través del componente
        height: '288px',
        width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.isDelete){
        console.log("Alumno eliminado");
        alert("Alumno eliminado correctamente.");
        //Recargar página
        window.location.reload();
      }else{
        alert("Alumno no se ha podido eliminar.");
        console.log("No se eliminó el alumno");
      }
    });
    }else{
      alert("No tienes permisos para eliminar este alumno.");
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
}

export interface DatosUsuario {
  id: number,
  matricula: number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string,
  telefono: string,
  rfc: string,
  edad: number;
}
