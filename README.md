# ClientesHumanIA

## Carrito Resolvedor de Laberintos en C

Un programa en C que implementa un **carrito autónomo** que resuelve laberintos utilizando el algoritmo **BFS (Búsqueda por Amplitud)**.

### Características

- **Algoritmo BFS**: Garantiza encontrar la solución más corta
- **Visualización**: Muestra el laberinto original y la solución
- **Gestión de memoria**: Uso de estructuras dinámicas eficientes
- **Código limpio**: Compilación sin warnings

### Compilación y ejecución

```bash
# Compilar
make

# Ejecutar
./maze_cart

# Limpiar
make clean
```

### Símbolos del laberinto

- `S` - Punto de inicio
- `E` - Punto de salida
- `*` - Camino de solución (ruta óptima encontrada)
- `v` - Celdas visitadas durante la búsqueda
- `#` - Paredes (obstáculos)
- ` ` - Caminos disponibles sin visitar

### Algoritmo BFS

El algoritmo BFS:
1. Parte desde la posición inicial (S)
2. Explora todas las celdas a la misma distancia antes de pasar a la siguiente
3. Mantiene un registro de celdas visitadas
4. Almacena la posición padre de cada celda para reconstruir el camino
5. Cuando encuentra la salida (E), reconstruye el camino óptimo
6. Marca todas las celdas del camino solución con `*`

### Complejidad

- **Tiempo**: O(filas × columnas) - Visita cada celda una sola vez
- **Espacio**: O(filas × columnas) - Por la cola y la matriz de visitados