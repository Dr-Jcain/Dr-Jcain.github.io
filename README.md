# JCain Engineering — sitio para GitHub Pages

Sitio estático preparado para crecer por **materias → unidades → temas**. No requiere backend ni proceso de compilación.

## Materias creadas en el portal

- Análisis de Algoritmos
- Fundamentos de Programación
- Laboratorio Abierto: Construcción
- Programación Estructurada
- Modelado y Simulación de Sistemas
- Teoría de Sistemas I

Por el momento, la materia con contenido desarrollado es **Modelado y Simulación de Sistemas**.

## Clase publicada

### 3.2.2 — La ecuación de movimiento de Lagrange

Incluye:

- teoría de acción estacionaria;
- deducción guiada de Euler–Lagrange;
- laboratorio interactivo con trayectoria perturbada;
- comprobación conceptual;
- cuatro problemas de repaso totalmente resueltos:
  1. partícula libre;
  2. masa–resorte sin amortiguamiento;
  3. caída vertical en gravedad uniforme;
  4. resorte sometido a una fuerza constante;
- bloque reservado para la tarea.

Los cuatro problemas repiten deliberadamente la misma secuencia didáctica:

1. construir `q_epsilon = q + epsilon*eta`;
2. linealizar el cambio del lagrangiano con Taylor a primer orden;
3. integrar por partes el término que contiene `eta_dot`;
4. usar `delta S = 0` y la arbitrariedad de `eta` para obtener Euler–Lagrange.

## Estructura de archivos

```text
/
├── index.html                         # portal de todas las materias
├── README.md
├── .nojekyll
├── assets/
│   ├── portal.css
│   └── portal.js
└── cursos/
    ├── analisis-algoritmos/
    │   └── index.html
    ├── fundamentos-programacion/
    │   └── index.html
    ├── laboratorio-abierto-construccion/
    │   └── index.html
    ├── programacion-estructurada/
    │   └── index.html
    ├── teoria-sistemas-i/
    │   └── index.html
    └── modelado-simulacion/
        ├── index.html                 # índice de la materia
        └── euler-lagrange/
            ├── index.html             # clase completa
            ├── styles.css
            └── app.js
```

## Publicación en GitHub Pages

Sube **el contenido de esta carpeta** a la raíz de un repositorio de GitHub. El archivo que debe quedar en la raíz es `index.html`.

Después activa GitHub Pages para la rama donde publiques el sitio. No hay que instalar MathJax en el servidor: la clase de Euler–Lagrange lo carga desde CDN y las ecuaciones se renderizan en el navegador.

Todos los enlaces internos usan rutas relativas, por lo que el sitio funciona tanto en un dominio `usuario.github.io/repositorio/` como en un dominio personalizado.

## Prueba local

Puedes abrir `index.html` directamente. Para probarlo como sitio web completo, desde esta carpeta también puedes ejecutar:

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

## Cómo agregar una nueva clase

La estructura recomendada es:

```text
/cursos/nombre-materia/nombre-del-tema/
    index.html
    styles.css       # sólo si el tema necesita estilos propios
    app.js           # sólo si el tema necesita interacción
```

Después se agrega una tarjeta/enlace en el `index.html` de la materia correspondiente.

La idea es conservar una plantilla didáctica común:

**Teoría → visualización/simulador → comprobación → 3–4 problemas → tarea → recursos.**
