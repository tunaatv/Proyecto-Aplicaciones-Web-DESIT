import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-actualizar-materia-modal',
  templateUrl: './actualizar-materia-modal.component.html',
  styleUrls: ['./actualizar-materia-modal.component.scss']
})
export class ActualizarMateriaModalComponent {

  constructor(
    private dialogRef: MatDialogRef<ActualizarMateriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any   // por si quieres mostrar info extra
  ) {}

  public cerrar_modal() {
    this.dialogRef.close({ isUpdate: false });
  }

  public confirmar_actualizacion() {
    this.dialogRef.close({ isUpdate: true });
  }
}
