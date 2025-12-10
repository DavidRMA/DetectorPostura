from django.shortcuts import render
from rest_framework import viewsets
from .models import Usuario, RegistroPostura
from .serializer import UsuarioSerializer, RegistroPosturaSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from datetime import timedelta

# Create your views here.
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    @action(detail=False, methods=['get'], url_path='listar_usuarios')
    def listar_usuarios(self, request):
        Usuario_queryset = Usuario.objects.all()
        serializer = UsuarioSerializer(Usuario_queryset, many=True)
        print("Listando usuarios...")
        return Response({
            'message': 'Usuarios obtenidos correctamente', 
            'data': serializer.data}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='consultar_usuario')
    def consultar_usuario(self, request, pk=None):
        try:
            usuario = self.get_object()
            serializer = UsuarioSerializer(usuario)
            return Response({
                'message': 'Usuario obtenido correctamente',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except Usuario.DoesNotExist:
            return Response({
                'error': f'Usuario con id {pk} no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], url_path='crear_usuario')
    def crear_usuario(self, request):
        print("Creando usuario...")
        print(request.data)
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            print("Usuario creado correctamente.")
            return Response({
                'message': 'Usuario creado correctamente', 
                'data':serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'error':'Error en la creacion del usuario'}, serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='registros')
    def obtener_registros(self, request, pk=None):
        try:
            usuario = self.get_object()  # ✅ Obtiene Usuario correctamente
            registros = RegistroPostura.objects.filter(usuario=usuario).order_by('-fechaRegistro')
            serializer = RegistroPosturaSerializer(registros, many=True)
            print(f"Listando registros del usuario {pk}...")
            return Response(
                {
                    'message': 'Registros obtenidos correctamente',
                    'data': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Usuario.DoesNotExist:
            return Response(
                {
                    'error': f'Usuario con id {pk} no encontrado'
                },
                status=status.HTTP_404_NOT_FOUND
            )

class RegistroPosturaViewSet(viewsets.ModelViewSet):
    queryset = RegistroPostura.objects.all()
    serializer_class = RegistroPosturaSerializer

    # endpoint para recepción de datos desde la ESP32
    @action(detail=False, methods=['post'], url_path='leer_registro')
    def leer_registro(self, request):
        print("Leyendo registro de postura desde ESP32...")
        print("Body recibido:", request.data)

        data = request.data

        # Si viene como lista (SenML típico: array de packs)
        if isinstance(data, list):
            if not data:
                return Response(
                    {"error": "Paquete SenML vacío"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data = data[0]  # tomamos el primer pack

        entries = data.get("e", [])

        def get_value(name, default=None):
            for m in entries:
                if m.get("n") == name:
                    return m.get("v", default)
            return default

        # =============================
        # Extraer valores del paquete
        # =============================
        tilt = get_value("posture/tilt", 0.0) or 0.0
        bad_posture = bool(get_value("posture/bad_posture", 0))
        threshold = get_value("posture/threshold", 15.0) or 15.0

        tilt = float(tilt)
        threshold = float(threshold)

        # =============================
        # Métricas para el registro
        # =============================
        # 1 si en ese instante hay mala postura, 0 si no
        numero_alertas = 1 if bad_posture else 0

        # Score 0-100:
        #   100   = postura perfecta (tilt <= threshold)
        #   0     = muy mala postura (tilt >= max_tilt)
        #   entre = escala lineal
        max_tilt = 60.0  # a partir de aquí consideramos 0 puntos

        if tilt <= threshold:
            score = 100.0
        elif tilt >= max_tilt:
            score = 0.0
        else:
            score = 100.0 * (max_tilt - tilt) / (max_tilt - threshold)

        # =============================
        # Asociar a un usuario
        # =============================
        # Por ahora: primer usuario de la BD (para pruebas)
        usuario = Usuario.objects.first()
        if not usuario:
            return Response(
                {"error": "No hay usuarios registrados para asociar el registro de postura"},
                status=status.HTTP_400_BAD_REQUEST
            )

        registro = RegistroPostura.objects.create(
            usuario=usuario,
            duracion=timedelta(seconds=1),   # duración de la muestra
            numeroAlertas=numero_alertas,
            score=score,
        )

        serializer = RegistroPosturaSerializer(registro)
        print("Registro guardado correctamente.")
        return Response(
            {
                "message": "Datos de postura recibidos correctamente",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    # endpoint para la comunicación con el front
    @action(detail=False, methods=['get'], url_path='obtener_registros')
    def listar_registros_usuario(self, request):
        registros = RegistroPostura.objects.all().order_by('-fechaRegistro')
        serializer = RegistroPosturaSerializer(registros, many=True)
        print("Listando registros de postura...")
        return Response(
            {
                'message': 'Registros obtenidos correctamente',
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )
