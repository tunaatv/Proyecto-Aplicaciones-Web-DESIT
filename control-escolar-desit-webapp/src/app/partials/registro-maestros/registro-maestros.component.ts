import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MaestrosService } from 'src/app/services/maestros.service';
import { MateriasService } from 'src/app/services/materias.service';
import { MatDialog } from '@angular/material/dialog';
import { ActualizarUserModalComponent } from 'src/app/modals/actualizar-user-modal/actualizar-user-modal.component';

@Component({
  selector: 'app-registro-maestros',
  templateUrl: './registro-maestros.component.html',
  styleUrls: ['./registro-maestros.component.scss']
})
export class RegistroMaestrosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  public maestro:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para el select
  public areas: any[] = [
    {value: '1', viewValue: 'Desarrollo Web'},
    {value: '2', viewValue: 'Programación'},
    {value: '3', viewValue: 'Bases de datos'},
    {value: '4', viewValue: 'Redes'},
    {value: '5', viewValue: 'Matemáticas'},
  ];

  public materias:any[] = [];

  constructor(
    private router: Router,
    private location : Location,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService,
    private maestrosService: MaestrosService,
    private materiasService: MateriasService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    //El primer if valida si existe un parámetro en la URL
    if(this.activatedRoute.snapshot.params['id'] != undefined){
      this.editar = true;
      //Asignamos a nuestra variable global el valor del ID que viene por la URL
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      //Al iniciar la vista asignamos los datos del user (normalizados)
      this.maestro = this.normalizeMaestro(this.datos_user);
    }else{
      // Si no va a editar, entonces inicializamos el JSON para registro nuevo
      this.maestro = this.maestrosService.esquemaMaestro();
      // Asegurar que materias_json sea un array inicial
      this.maestro.materias_json = this.maestro.materias_json ?? [];
      this.maestro.rol = this.rol;
      this.token = this.facadeService.getSessionToken();
    }
    //Imprimir datos en consola
    console.log("Maestro (normalizado): ", this.maestro);

    // Cargar opciones de materias para el select
    this.obtenerMaterias();
  }

  public regresar(){
    this.location.back();
  }

  public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    //Validar la contraseña
    if(this.maestro.password == this.maestro.confirmar_password){
      this.maestrosService.registrarMaestro(this.maestro).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Maestro registrado exitosamente");
          console.log("Maestro registrado: ", response);
          if(this.token && this.token !== ""){
            this.router.navigate(["maestros"]);
          }else{
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar maestro");
          console.error("Error al registrar maestro: ", error);
        }
      );
    }else{
      alert("Las contraseñas no coinciden");
      this.maestro.password="";
      this.maestro.confirmar_password="";
    }
  }

  public actualizar(){
    // Validación de los datos
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    const dialogRef = this.dialog.open(ActualizarUserModalComponent, {
      data: { rol: 'maestro' },  // esto se mostrará en el título del modal
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isUpdate) {
        // mandamos el PUT
        this.maestrosService.actualizarMaestro(this.maestro).subscribe(
          (response) => {
            alert("Maestro actualizado exitosamente");
            console.log("Maestro actualizado: ", response);
            this.router.navigate(["maestros"]);
          },
          (error) => {
            alert("Error al actualizar maestro");
            console.error("Error al actualizar maestro: ", error);
          }
        );
      } else {
        console.log("Actualización de alumno cancelada por el usuario");
      }
    });
  }

  //Funciones para password
  showPassword()
  {
    if(this.inputType_1 == 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  showPwdConfirmar()
  {
    if(this.inputType_2 == 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    console.log(event);
    console.log(event.value.toISOString());

    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.maestro.fecha_nacimiento);
  }

  // Normalizar la estructura que viene del padre/backend
  private normalizeMaestro(datos: any): any {
    if (!datos) {
      const nuevo = this.maestrosService.esquemaMaestro();
      nuevo.materias_json = nuevo.materias_json ?? [];
      return nuevo;
    }

    // Si hay objeto anidado user, preferirlo para ciertos campos
    const source = datos.user ? { ...datos, ...datos.user } : datos;

    const normalized: any = { ...datos }; // conservamos todo
    normalized.first_name = source.first_name ?? '';
    normalized.last_name  = source.last_name  ?? '';
    normalized.email      = source.email      ?? '';

    let materias = datos.materias_json ?? datos.materias ?? [];
    if (typeof materias === 'string') {
      try {
        materias = JSON.parse(materias);
      } catch {
        materias = [];
      }
    }
    if (!Array.isArray(materias)) {
      materias = [];
    }
    normalized.materias_json = materias;

    // otros campos que puedas necesitar:
    normalized.id_trabajador    = datos.id_trabajador ?? datos.id_trabajador;
    normalized.fecha_nacimiento = datos.fecha_nacimiento ?? null;
    normalized.telefono         = datos.telefono ?? '';
    normalized.cubiculo         = datos.cubiculo ?? '';
    normalized.area_investigacion = datos.area_investigacion ?? '';
    normalized.rol              = this.rol ?? datos.tipo_usuario ?? datos.rol;

    return normalized;
  }

  // Funciones para los checkbox
  public checkboxChange(event:any){
    console.log("Evento: ", event);
    // Asegurar que materias_json sea un array
    if(!Array.isArray(this.maestro.materias_json)){
      this.maestro.materias_json = [];
    }

    if(event.checked){
      // evitar duplicados
      if(!this.maestro.materias_json.includes(event.source.value)){
        this.maestro.materias_json.push(event.source.value);
      }
    }else{
      const idx = this.maestro.materias_json.indexOf(event.source.value);
      if(idx > -1) this.maestro.materias_json.splice(idx,1);
    }
    console.log("Array materias: ", this.maestro.materias_json);
  }

  public revisarSeleccion(nombre: string){
    if(!Array.isArray(this.maestro.materias_json)){
      return false;
    }
    return this.maestro.materias_json.find((element)=> element === nombre) !== undefined;
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

  obtenerMaterias(): void {
    this.materiasService.obtenerListaMaterias().subscribe(
      (response) => {
        this.materias = response;
        console.log('Materias:', this.materias);
      },
      (error) => {
        console.error('Error al obtener maestros', error);
      }
    );
  }
}
