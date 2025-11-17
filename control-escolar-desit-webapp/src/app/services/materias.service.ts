import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FacadeService } from './facade.service';
import { ErrorsService } from './tools/errors.service';
import { ValidatorService } from './tools/validator.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class MateriasService {

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  public esquemaMateria(){
    return {
      'nrc':'',
      'nombre': '',
      'seccion': '',
      'dias_json': [],
      'hora_inicio': '',
      'hora_fin': '',
      'salon': '',
      'carrera': '',
      'maestro': '',
      'creditos': '',
    }
  }

  //Validación para el formulario
  public validarMateria(data: any, editar: boolean){
    console.log("Validando materia... ", data);
    let error: any = [];

    if(!this.validatorService.required(data["nrc"])){
      error["nrc"] = this.errorService.required;
    }else if(!this.validatorService.min(data["nrc"], 5)){
      error["nrc"] = this.errorService.min(5);
      alert("La longitud de caracteres del NRC es menor, deben ser 5");
    }else if(!this.validatorService.max(data["nrc"], 5)){
      error["nrc"] = this.errorService.max(5);
      alert("La longitud de caracteres del NRC es mayor, deben ser 5");
    }

    if(!this.validatorService.required(data["nombre"])){
      error["nombre"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["seccion"])){
      error["seccion"] = this.errorService.required;
    }else if(!this.validatorService.min(data["seccion"], 3)){
      error["seccion"] = this.errorService.min(3);
      alert("La longitud de caracteres de la seccion es menor, deben ser 3");
    }else if(!this.validatorService.max(data["seccion"], 3)){
      error["seccion"] = this.errorService.max(3);
      alert("La longitud de caracteres de la seccion es mayor, deben ser 3");
    }

    if(!this.validatorService.required(data["dias_json"])){
      error["dias_json"] = "Debes seleccionar dias para poder registrar la materia";
    }

    if(!this.validatorService.required(data["hora_inicio"])){
      error["hora_inicio"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["hora_fin"])){
      error["hora_fin"] = this.errorService.required;
    }

    // Validar que inicio < fin
    if (data['hora_inicio'] && data['hora_fin']) {
      const [h1, m1] = data['hora_inicio'].split(':').map((x: string) => parseInt(x, 10));
      const [h2, m2] = data['hora_fin'].split(':').map((x: string) => parseInt(x, 10));

      const inicioMin = h1 * 60 + m1;
      const finMin    = h2 * 60 + m2;

      if (inicioMin >= finMin) {
        error['hora_fin'] = 'La hora de inicio debe ser menor que la hora de finalización';
        alert('La hora de inicio debe ser menor que la hora de finalización');
      }
    }

    if(!this.validatorService.required(data["salon"])){
      error["salon"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["carrera"])){
      error["carrera"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["maestro"])){
      error["maestro"] = this.errorService.required;
    }

    // --- Créditos
    const creditosRaw = data["creditos"];
    const creditosStr = (creditosRaw ?? '').toString().trim();
    console.log('>>> creditos en validación:', creditosStr, typeof creditosRaw);

    if (!this.validatorService.required(creditosStr)) {
      // Campo vacío
      error["creditos"] = this.errorService.required;

    } else if (creditosStr.length < 1) {
      error["creditos"] = this.errorService.min(1);
      alert("La longitud de caracteres de créditos es menor, deben ser al menos 1 dígito");

    } else if (creditosStr.length > 2) {
      error["creditos"] = this.errorService.max(2);
      alert("La longitud de caracteres de créditos es mayor, deben ser máximo 2 dígitos");
    }
    //Return arreglo
    return error;
  }

  //Aquí van los servicios HTTP
  //Servicio para registrar un nuevo usuario
  public registrarMateria (data: any): Observable <any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.post<any>(`${environment.url_api}/materias/`, data, { headers });
  }

  // Petición para obtener un materia por su ID
  public obtenerMateriaPorID(idMateria: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.get<any>(`${environment.url_api}/materias/?id=${idMateria}`, { headers });
  }

  // Petición para actualizar
  public actualizarMateria(data: any): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.put<any>(`${environment.url_api}/materias/`, data, { headers });
  }

  //Servicio para obtener la lista de materias
  public obtenerListaMaterias(): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.get<any>(`${environment.url_api}/lista-materias/`, { headers });
  }

  //Servicio para eliminar
  public eliminarMateria(idMateria: number): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.delete<any>(`${environment.url_api}/materias/?id=${idMateria}`, { headers });
  }
}
