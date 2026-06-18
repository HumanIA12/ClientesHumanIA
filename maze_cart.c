#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define WALL '#'
#define PATH ' '
#define VISITED 'v'
#define SOLUTION '*'
#define START 'S'
#define END 'E'

typedef struct {
    int x;
    int y;
} Position;

typedef struct {
    Position *items;
    int front;
    int rear;
    int size;
} Queue;

Queue* createQueue(int size) {
    Queue *q = (Queue*)malloc(sizeof(Queue));
    q->items = (Position*)malloc(sizeof(Position) * size);
    q->front = 0;
    q->rear = -1;
    q->size = size;
    return q;
}

void enqueue(Queue *q, Position pos) {
    if (q->rear < q->size - 1) {
        q->items[++q->rear] = pos;
    }
}

Position dequeue(Queue *q) {
    return q->items[q->front++];
}

int isEmpty(Queue *q) {
    return q->front > q->rear;
}

void freeQueue(Queue *q) {
    free(q->items);
    free(q);
}

void printMaze(char **maze, int rows, int cols) {
    printf("\n");
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%c", maze[i][j]);
        }
        printf("\n");
    }
    printf("\n");
}

int isValid(char **maze, int rows, int cols, int x, int y, char **visited) {
    return (x >= 0 && x < rows && y >= 0 && y < cols &&
            maze[x][y] != WALL && visited[x][y] == 0);
}

int solveMaze(char **maze, int rows, int cols, Position start, Position end) {
    Queue *q = createQueue(rows * cols);
    char **visited = (char**)malloc(rows * sizeof(char*));
    for (int i = 0; i < rows; i++) {
        visited[i] = (char*)calloc(cols, sizeof(char));
    }

    int dx[] = {-1, 1, 0, 0};
    int dy[] = {0, 0, -1, 1};

    Position *parent = (Position*)malloc(rows * cols * sizeof(Position));
    for (int i = 0; i < rows * cols; i++) {
        parent[i].x = -1;
        parent[i].y = -1;
    }

    enqueue(q, start);
    visited[start.x][start.y] = 1;

    while (!isEmpty(q)) {
        Position curr = dequeue(q);

        if (curr.x == end.x && curr.y == end.y) {
            // Reconstruir el camino
            Position path[rows * cols];
            int pathLen = 0;
            Position p = end;
            path[pathLen++] = p;

            while (!(p.x == start.x && p.y == start.y)) {
                int idx = p.x * cols + p.y;
                Position par = parent[idx];
                if (par.x == -1) break;
                p = par;
                path[pathLen++] = p;
            }

            // Marcar la solución en el laberinto
            for (int i = 0; i < pathLen; i++) {
                if (!(path[i].x == start.x && path[i].y == start.y) &&
                    !(path[i].x == end.x && path[i].y == end.y)) {
                    maze[path[i].x][path[i].y] = SOLUTION;
                }
            }

            printf("¡Laberinto resuelto! Camino encontrado con %d pasos.\n", pathLen - 1);

            // Liberar memoria
            free(parent);
            for (int i = 0; i < rows; i++) {
                free(visited[i]);
            }
            free(visited);
            freeQueue(q);
            return 1;
        }

        // Explorar vecinos
        for (int i = 0; i < 4; i++) {
            int nx = curr.x + dx[i];
            int ny = curr.y + dy[i];

            if (isValid(maze, rows, cols, nx, ny, visited)) {
                visited[nx][ny] = 1;
                Position next = {nx, ny};
                int idx = nx * cols + ny;
                parent[idx] = curr;
                enqueue(q, next);
                maze[nx][ny] = VISITED;
            }
        }
    }

    printf("¡No se encontró solución!\n");

    // Liberar memoria
    free(parent);
    for (int i = 0; i < rows; i++) {
        free(visited[i]);
    }
    free(visited);
    freeQueue(q);
    return 0;
}

int main() {
    // Definir un laberinto sencillo pero no trivial
    // S = inicio, E = salida, # = pared, ' ' = camino
    char maze_array[11][21] = {
        {'#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'},
        {'#', 'S', ' ', ' ', '#', ' ', ' ', ' ', ' ', '#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'},
        {'#', ' ', '#', ' ', '#', ' ', '#', '#', ' ', '#', ' ', '#', '#', '#', '#', '#', '#', '#', '#', ' ', '#'},
        {'#', ' ', '#', ' ', ' ', ' ', '#', ' ', ' ', ' ', ' ', ' ', '#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'},
        {'#', ' ', '#', '#', '#', '#', '#', ' ', '#', '#', '#', ' ', '#', ' ', '#', '#', '#', '#', '#', '#', '#'},
        {'#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'},
        {'#', '#', '#', ' ', '#', '#', '#', '#', '#', ' ', '#', '#', '#', ' ', '#', '#', '#', '#', '#', ' ', '#'},
        {'#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '#'},
        {'#', ' ', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', ' ', '#', '#', '#', '#', '#', '#', '#'},
        {'#', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'E', '#'},
        {'#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#', '#'}
    };

    int rows = 11;
    int cols = 21;

    // Crear matriz dinámicamente
    char **maze = (char**)malloc(rows * sizeof(char*));
    for (int i = 0; i < rows; i++) {
        maze[i] = (char*)malloc(cols * sizeof(char));
        for (int j = 0; j < cols; j++) {
            maze[i][j] = maze_array[i][j];
        }
    }

    // Encontrar inicio y fin
    Position start, end;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (maze[i][j] == START) {
                start.x = i;
                start.y = j;
            }
            if (maze[i][j] == END) {
                end.x = i;
                end.y = j;
            }
        }
    }

    printf("\n===== CARRITO RESOLVEDOR DE LABERINTOS =====\n");
    printf("Algoritmo: BFS (Búsqueda por Amplitud)\n");
    printf("\nLaberinto original:\n");
    printMaze(maze, rows, cols);

    printf("Iniciando búsqueda...\n");
    printf("Posición inicio: (%d, %d)\n", start.x, start.y);
    printf("Posición salida: (%d, %d)\n\n", end.x, end.y);

    if (solveMaze(maze, rows, cols, start, end)) {
        printf("\nLaberinto resuelto:\n");
        printMaze(maze, rows, cols);
        printf("Leyenda:\n");
        printf("  S = Punto de inicio\n");
        printf("  E = Punto de salida\n");
        printf("  * = Camino de solución\n");
        printf("  v = Celdas visitadas\n");
        printf("  # = Paredes\n");
    }

    // Liberar memoria
    for (int i = 0; i < rows; i++) {
        free(maze[i]);
    }
    free(maze);

    return 0;
}
