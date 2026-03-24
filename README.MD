# PERSONAL PORTFOLIO

## Fase 1
De primeras usé un fork de [M4TT72 | Terminal](https://term.m4tt72.com), una manera de partir
de un proyecto existente, modificarlo a mi manera y adaptarlo a mis necesidades.

## Fase 2
Una vez aprendí desarrollo en Java tras una asignatura en la carrera, pensé en hacerlo a mi manera.
Estudio Ingeniería de Ciberseguridad y la aplicación que más utilizo en el día a día es la terminal,
así que me basé en esto para este proyecto.

No quería solo un portfolio con información estática. Quería poder subir posts de proyectos o
charlas a las que voy, conocimiento nuevo que aprendo, y problemas y soluciones que me surgen en
el día a día. Por ello diseñé un apartado específico para ello.

Siempre tomo notas y baso mi vida en torno a Notion, que tiene una forma de exportar páginas de
manera sencilla en formato Markdown junto con las imágenes, códigos y bloques que contengan.
Implementé el apartado de blog para que simplemente exportando una página y poniéndola en una
carpeta ya aparezca en la web.

---

Ahora estamos en el auge de la inteligencia artificial, ¿por qué no usar una IA para que hable de mí?

Configuré un modelo que define si la entrada del usuario pertenece a la categoría BLOG o GENERAL
y en función de eso entra en un prompt inicial u otro:

- General: responderá de manera genérica a cuestiones que el usuario le proponga, ya sea acerca
  de mí o sobre cuestiones generales.
- Blog: si se está preguntando sobre un post en concreto, el prompt que se le pasará será el
  propio post con otro prompt inicial, y responderá acorde a ello.

Hay easter eggs escondidos en el prompt, intenta encontrarlos.

---

La parte de servicios se divide en habilidades que tengo y de las cuales ofrezco servicios por
si alguien está interesado. Si alguien rellena el formulario se escribirá en un archivo y de
manera interna se puede revisar.

---

En un futuro irán surgiendo más aplicaciones al escritorio. En cualquier caso estoy abierto a
sugerencias tanto de funcionalidad, estética o seguridad.