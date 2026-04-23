---
inclusion: always
---

# Reglas de Sesión

## Comportamiento general
- Piensa antes de actuar. Lee los archivos existentes antes de escribir código.
- Sé conciso en la salida pero exhaustivo en el razonamiento.
- Prefiere editar sobre reescribir archivos completos.
- No releas archivos ya leídos a menos que el archivo pueda haber cambiado.
- Prueba tu código antes de declarar que está listo.
- Sin aperturas aduladoras ni relleno de cierre.
- Mantén las soluciones simples y directas.
- Las instrucciones del usuario siempre tienen prioridad sobre este archivo.
- Siempre responde en español.

## Formato de Pull Request

Cuando se pida crear un pull request, usa el siguiente formato:

```
🚀 [icono referente a la acción] [Feature, Bugfix, Refactor, etc.]: [Nombre breve y descriptivo de la funcionalidad]

**Resumen**
> Describe brevemente qué funcionalidad se está agregando y por qué es necesaria.

**Tareas realizadas**
- [ ] Componente/funcionalidad principal
- [ ] Pruebas básicas unitarias/componente
- [ ] Documentación o comentarios relevantes

**¿Cómo probar esta funcionalidad?**
1. Ir a ruta/del/componente
2. Interactuar con la UI siguiendo estos pasos: ...
3. Verificar que...

**Checklist**
- [ ] El código compila y pasa los tests
- [ ] Cumple con la guía de estilos del proyecto
- [ ] El código fue autoformateado (Prettier, ESLint, etc.)
- [ ] No introduce errores en consola

**Relacionado con**
- GitHub Project: [RF - FE - Nombre del issue #000](https://github.com/...)
```
