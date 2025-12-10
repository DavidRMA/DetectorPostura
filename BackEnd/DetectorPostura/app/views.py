from django.shortcuts import render
from rest_framework import viewsets
from .models import Usuario, RegistroPostura
from .serializer import UsuarioSerializer, RegistroPosturaSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from datetime import timedelta

def calculate_posture_score(tilt_angle, threshold, bad_posture):
    """
    Calcula el score de postura de 0-100 basado en:
    - tilt_angle: ángulo de inclinación actual (grados)
    - threshold: umbral permitido (grados)
    - bad_posture: booleano indicando si es mala postura
    """
    # Si no es mala postura (ángulo <= umbral), score perfecto
    if not bad_posture:
        return 100.0
    
    # Si es mala postura, calcular penalización progresiva
    # Asumimos que el ángulo máximo razonable es 50° para cálculo
    MAX_REASONABLE_ANGLE = 50.0
    
    # Asegurar que tilt_angle no exceda el máximo razonable
    tilt_angle = min(tilt_angle, MAX_REASONABLE_ANGLE)
    
    # Calcular qué tan mal está la postura
    # Si está justo en el umbral, score 100
    # Si está en MAX_REASONABLE_ANGLE, score 0
    if tilt_angle <= threshold:
        return 100.0
    else:
        # Mapeo lineal de [threshold, MAX_REASONABLE_ANGLE] a [100, 0]
        score = 100.0 - ((tilt_angle - threshold) / (MAX_REASONABLE_ANGLE - threshold)) * 100.0
        return max(0.0, min(100.0, score))

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
            usuario = self.get_object()
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
        tilt = get_value("posture/tilt", 0.0)
        bad_posture = bool(get_value("posture/bad_posture", 0))
        threshold = get_value("posture/threshold", 15.0)

        # Convertir a valores numéricos seguros
        try:
            tilt = float(tilt) if tilt is not None else 0.0
        except (TypeError, ValueError):
            tilt = 0.0
            
        try:
            threshold = float(threshold) if threshold is not None else 15.0
        except (TypeError, ValueError):
            threshold = 15.0

        # =============================
        # CALCULAR SCORE EN EL BACKEND
        # =============================
        score = calculate_posture_score(tilt, threshold, bad_posture)

        # =============================
        # Métricas para el registro
        # =============================
        numero_alertas = 1 if bad_posture else 0

        print(
            f"[BACK] tilt={tilt}, threshold={threshold}, "
            f"bad_posture={bad_posture}, score_calculado={score}"
        )

        # =============================
        # Asociar a un usuario
        # =============================
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
            score=score,                     # ✅ Score calculado en backend
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