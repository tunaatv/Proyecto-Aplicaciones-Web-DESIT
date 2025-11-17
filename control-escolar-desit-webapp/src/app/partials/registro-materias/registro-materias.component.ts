import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MateriasService } from 'src/app/services/materias.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { MatDialog } from '@angular/material/dialog';
import { ActualizarMateriaModalComponent } from 'src/app/modals/actualizar-materia-modal/actualizar-materia-modal.component';

@Component({
  selector: 'app-registro-materias',
  templateUrl: './registro-materias.component.html',
  styleUrls: ['./registro-materias.component.scss']
})
export class RegistroMateriasComponent implements OnInit{

  public rol: string = '';
  @Input() datos_materia: any = {};

  public materia:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idMateria: number = 0;
  public lista_maestros: any[] = [];

  //Para el checkbox de dias
  public dias:any[] = [
    {value: '1', dia: 'Lunes'},
    {value: '2', dia: 'Martes'},
    {value: '3', dia: 'Miércoles'},
    {value: '4', dia: 'Jueves'},
    {value: '5', dia: 'Viernes'},
  ];

  //Para el select de maestros
  public maestros: any[] = [];

  //Para el select de carreras
  public carreras: any[] = [
    {value: '1', viewValue: 'Ingeniería en Ciencias de la Computación'},
    {value: '2', viewValue: 'Licenciatura en Ciencias de la Computación'},
    {value: '3', viewValue: 'Ingeniería en Tecnologías de la Información'},
  ];

  constructor(
    private router: Router,
    private location : Location,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService,
    private materiasService: MateriasService,
    private maestrosService: MaestrosService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // Token y rol del usuario
    this.token = this.facadeService.getSessionToken();
    this.rol   = this.facadeService.getUserGroup();

    // Si no hay sesión, al login
    if (!this.token) {
      this.router.navigate(['/']);
      return;
    }

    //Solo admin puede entrar a registro-materias y registro-usuarios
    if (this.rol !== 'administrador') {
      this.router.navigate(['/materias']);
      return;
    }

    const idParam = this.activatedRoute.snapshot.params['id'];

    if (idParam !== undefined) {
      // Modo edición
      this.editar = true;
      this.idMateria = Number(idParam);
      console.log('ID Materia: ', this.idMateria);

      // Llamada al backend para obtener la materia
      this.materiasService.obtenerMateriaPorID(this.idMateria).subscribe(
        (resp) => {
          console.log('Materia:', resp);
          this.materia = this.normalizeMateria(resp);
          console.log('Materia (normalizada): ', this.materia);
        },
        (error) => {
          console.error('Error al obtener materia por ID: ', error);
          alert('No se pudo cargar la materia para edición.');
          // Inicializar como nueva para no dejar el form roto
          this.materia = this.materiasService.esquemaMateria();
          this.materia.dias_json = this.materia.dias_json ?? [];
        }
      );

    } else {
      // Nueva materia
      this.editar = false;
      this.materia = this.materiasService.esquemaMateria();
      this.materia.dias_json = this.materia.dias_json ?? [];
      console.log('Materia (nueva): ', this.materia);
    }

    // Cargar maestros para el combo, si tienes este método
    this.obtenerMaestros();
  }


  public regresar(){
    this.location.back();
  }

  public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.materiasService.validarMateria(this.materia, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    //Registrar
    this.materiasService.registrarMateria(this.materia).subscribe(
      (response) => {
        // Redirigir o mostrar mensaje de éxito
        alert("Materia registrada exitosamente");
        console.log("Materia registrada: ", response);
        if(this.token && this.token !== ""){
          this.router.navigate(["materias"]);
        }else{
          this.router.navigate(["/"]);
        }
      },
      (error) => {
        // Manejar errores de la API
        alert("Error al registrar materia");
        console.error("Error al registrar materia: ", error);
      }
    );
  }

  public actualizar(){
    // Validación de los datos
    this.errors = {};
    this.errors = this.materiasService.validarMateria(this.materia, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    const dialogRef = this.dialog.open(ActualizarMateriaModalComponent, {
      data: { id: this.materia.id },   // o materia.id si es para materias
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isUpdate) {
        //Si se confirmó, se llama al servicio
        this.materiasService.actualizarMateria(this.materia).subscribe(
          (response) => {
            alert("Materia actualizado exitosamente");
            console.log("Materia actualizada: ", response);
            this.router.navigate(["materias"]);
          },
          (error) => {
            alert("Error al actualizar materia");
            console.error("Error al actualizar materia: ", error);
          }
        );
      } else {
        // Se canceló la actualización
        console.log("Actualización cancelada por el usuario");
      }
    });
  }

  normalizeMateria(datos: any): any{
    if (!datos) {
      const nuevo = this.materiasService.esquemaMateria();
      nuevo.dias_json = nuevo.dias_json ?? [];
      return nuevo;
    }

    // Si hay objeto anidado user, preferirlo para ciertos campos
    const source = datos.user ? { ...datos, ...datos.user } : datos;

    const normalized: any = { ...datos }; // conservamos todo
    normalized.nrc = source.nrc ?? '';
    normalized.nombre = source.nombre ?? '';
    normalized.seccion = source.seccion ?? '';
    // Mantener materias_json tal como viene
    normalized.dias_json = datos.dias_json ?? datos.dias ?? [];
    // otros campos:
    normalized.hora_inicio = datos.hora_inicio
      ? datos.hora_inicio.toString().slice(0, 5)
      : '';

    normalized.hora_fin = datos.hora_fin
      ? datos.hora_fin.toString().slice(0, 5)
      : '';
    normalized.salon = datos.salon ?? '';
    normalized.carrera = datos.carrera ?? '';
    normalized.profesor = datos.profesor ?? '';
    normalized.creditos = datos.creditos ?? '';

    return normalized;
  }

  // Funciones para los checkbox
  public checkboxChange(event:any){
    console.log("Evento: ", event);
    // Asegurar que materias_json sea un array
    if(!Array.isArray(this.materia.dias_json)){
      this.materia.dias_json = [];
    }

    if(event.checked){
      // evitar duplicados
      if(!this.materia.dias_json.includes(event.source.value)){
        this.materia.dias_json.push(event.source.value);
      }
    }else{
      const idx = this.materia.dias_json.indexOf(event.source.value);
      if(idx > -1) this.materia.dias_json.splice(idx,1);
    }
    console.log("Array materias: ", this.materia.dias_json);
  }

  public revisarSeleccion(nombre: string){
    if(!Array.isArray(this.materia.dias_json)){
      return false;
    }
    return this.materia.dias_json.find((element)=> element === nombre) !== undefined;
  }

  public soloLetras(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo letras (mayúsculas y minúsculas) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
      charCode !== 32                         // Espacio
    ) {
      event.preventDefault();
    }
  }

  validar(event: KeyboardEvent): void {
    const regex = /^[a-zA-Z0-9]$/;
    const inputChar = event.key;
    if (!regex.test(inputChar)) {
      event.preventDefault(); // bloquea espacios y símbolos
    }
  }

  obtenerMaestros(): void {
    this.maestrosService.obtenerListaMaestros().subscribe(
      (response) => {
        this.maestros = response;
        console.log('Maestros:', this.maestros);
      },
      (error) => {
        console.error('Error al obtener maestros', error);
      }
    );
  }
}
