import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-actualizar-user-modal',
  templateUrl: './actualizar-user-modal.component.html',
  styleUrls: ['./actualizar-user-modal.component.scss']
})
export class ActualizarUserModalComponent implements OnInit {

  public rol: string = "";

  constructor(
    private dialogRef: MatDialogRef<ActualizarUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.rol = this.data.rol;
  }

  public cerrar_modal() {
    // Para actualización usamos isUpdate, no isDelete
    this.dialogRef.close({ isUpdate: false });
  }

  public confirmar_actualizacion() {
    this.dialogRef.close({ isUpdate: true });
  }
}
