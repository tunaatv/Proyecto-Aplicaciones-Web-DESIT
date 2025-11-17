from django.db.models import *
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, generics, status
from rest_framework.response import Response
import json

from control_escolar_desit_api.models import Materias
from control_escolar_desit_api.serializers import MateriaSerializer

class MateriasAll(generics.CreateAPIView):
    #Esencial para todo donde se requiera autorización
    permission_classes = (permissions.IsAuthenticated,)
    #obtener todos los maestros
    def get(self, request, *args, **kwargs):
        materias = Materias.objects.all().order_by("nrc")
        lista = MateriaSerializer(materias, many=True).data
        for materia in lista:
            if isinstance(materia, dict) and "dias_json" in materia:
                try:
                    materia["dias_json"] = json.loads(materia["dias_json"])
                except Exception:
                    materia["dias_json"] = []
        return Response(lista, 200)

class MateriasView(generics.CreateAPIView):
    # Registrar nueva materia
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        dias = data.get("dias_json", [])
        if isinstance(dias, list):
            data["dias_json"] = json.dumps(dias)

        serializer = MateriaSerializer(data=data)
        if serializer.is_valid():
            materia = serializer.save()
            return Response(
                {
                    "message": "Materia registrada correctamente",
                    "materia": MateriaSerializer(materia).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    #Obtener una materia por id
    def get(self, request, *args, **kwargs):
        id_materia = request.GET.get("id", None)
        materia = get_object_or_404(Materias, id=id_materia)
        data = MateriaSerializer(materia).data

        if isinstance(data.get("dias_json"), str) and data["dias_json"]:
            try:
                data["dias_json"] = json.loads(data["dias_json"])
            except Exception:
                data["dias_json"] = []

        return Response(data, status=status.HTTP_200_OK)
    
    # Actualizar materia
    @transaction.atomic
    def put(self, request, *args, **kwargs):
        permission_classes = (permissions.IsAuthenticated,)

        materia_id = request.data.get("id")
        materia = get_object_or_404(Materias, id=materia_id)

        materia.nrc = request.data["nrc"]
        materia.nombre = request.data["nombre"]
        materia.seccion = request.data["seccion"]
        
        dias = request.data.get("dias_json", [])
        if isinstance(dias, list):
            materia.dias_json = json.dumps(dias)
        else:
            materia.dias_json = dias

        materia.hora_inicio = request.data["hora_inicio"]
        materia.hora_fin = request.data["hora_fin"]
        materia.salon = request.data["salon"]
        materia.carrera = request.data["carrera"]
        materia.maestro = request.data["maestro"]
        materia.creditos = request.data["creditos"]

        materia.save()

        return Response(
            {
                "message": "Materia actualizada correctamente",
                "materia": MateriaSerializer(materia).data
            },
            status=status.HTTP_200_OK
        )
    
    # Eliminar materia
    @transaction.atomic
    def delete(self, request, *args, **kwargs):
        materia = get_object_or_404(Materias, id=request.GET.get("id"))
        try:
            materia.delete()
            return Response({"Materia eliminada correctamente"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"Algo pasó al eliminar"},400)