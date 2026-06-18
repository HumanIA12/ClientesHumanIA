from __future__ import annotations

import argparse
import random
import textwrap
from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence, Tuple


@dataclass
class InventoryItem:
    """Representa un repuesto o componente manejado por MODASA."""

    name: str
    code: str
    compatible_with: List[str]
    stock: int
    lead_time_days: int
    description: str

    def matches(self, query: str) -> bool:
        normalized_query = query.lower()
        haystack = " ".join([self.name, self.description, " ".join(self.compatible_with)]).lower()
        return normalized_query in haystack

    def score(self, terms: Iterable[str]) -> int:
        haystack = " ".join([self.name, self.description, " ".join(self.compatible_with)]).lower()
        return sum(haystack.count(term) for term in terms)

    def summary(self) -> str:
        compat = ", ".join(self.compatible_with)
        return (
            f"- {self.name} (código {self.code}) — Stock: {self.stock} unidades, "
            f"plazo: {self.lead_time_days} días. Compatibles: {compat}. {self.description}"
        )


class ModasaKnowledgeBase:
    """Concentrado de datos y respuestas rápidas sobre MODASA."""

    def __init__(self) -> None:
        self.inventory: List[InventoryItem] = [
            InventoryItem(
                name="Filtro de aire reforzado",
                code="FIL-AG-450",
                compatible_with=["tractores John Deere serie 6", "motores Perkins 1100"],
                stock=24,
                lead_time_days=2,
                description="Filtro de alto flujo para ambientes con polvo fino.",
            ),
            InventoryItem(
                name="Kit de correa trapezoidal",
                code="CRR-SET-210",
                compatible_with=["cosechadoras New Holland CX", "grupos electrógenos Cummins 250 kVA"],
                stock=12,
                lead_time_days=3,
                description="Incluye tensores y guía de instalación.",
            ),
            InventoryItem(
                name="Inyector diésel calibrado",
                code="INY-DIE-1300",
                compatible_with=["motor MTU serie 2000", "motor Volvo Penta TAD1344GE"],
                stock=8,
                lead_time_days=4,
                description="Probado en banco y listo para instalar.",
            ),
            InventoryItem(
                name="Módulo de control automático (ATS)",
                code="ATS-100A",
                compatible_with=["grupos electrógenos MODASA 100-200 kVA", "paneles Deep Sea"],
                stock=5,
                lead_time_days=5,
                description="Permite transferencia automática red/grupo con registros de eventos.",
            ),
            InventoryItem(
                name="Servicio de mantenimiento preventivo",
                code="SRV-MP-01",
                compatible_with=["grupos electrógenos MODASA", "equipos Caterpillar y Cummins"],
                stock=999,
                lead_time_days=7,
                description="Incluye cambio de filtros, ajuste eléctrico y pruebas de carga.",
            ),
            InventoryItem(
                name="Tablero de conmutación manual",
                code="TCM-063A",
                compatible_with=["grupos electrógenos hasta 63A", "micro redes agrícolas"],
                stock=15,
                lead_time_days=2,
                description="Con enclavamiento mecánico y señalización LED.",
            ),
        ]

        self.service_packages: Dict[str, str] = {
            "preventivo": "Rutinas calendarizadas, cambio de filtros, torques, limpieza de radiador y pruebas bajo carga.",
            "correctivo": "Diagnóstico en campo, reemplazo de componentes críticos y pruebas finales documentadas.",
            "instalacion": "Montaje eléctrico y mecánico de grupos electrógenos, configuración ATS y puesta en marcha.",
        }

        self.contact_info = textwrap.dedent(
            """
            📞 Central: +51 1 611 5555
            📧 Correo: servicio@modasa.com.pe / repuestos@modasa.com.pe
            📍 Almacén principal: Av. Industrial 123, Lima
            ⏰ Horario: L-V de 8:00 a 18:00
            """
        ).strip()

    def search_inventory(self, query: str) -> List[InventoryItem]:
        if not query:
            return []
        terms = [term for term in query.lower().split() if len(term) > 2]
        scored: List[Tuple[int, InventoryItem]] = [
            (item.score(terms), item) for item in self.inventory if item.matches(query) or item.score(terms) > 0
        ]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [item for score, item in scored if score > 0]

    def list_services(self) -> str:
        bullets = [f"- {nombre.title()}: {detalle}" for nombre, detalle in self.service_packages.items()]
        return "\n".join(bullets)


class ModasaChatbot:
    """Chatbot ligero en puro Python para atención de clientes MODASA."""

    def __init__(self, knowledge_base: ModasaKnowledgeBase) -> None:
        self.kb = knowledge_base
        self.intents: Dict[str, Sequence[str]] = {
            "saludo": ("hola", "buenas", "buenos", "saludo"),
            "repuestos": ("repuesto", "filtro", "correa", "inyector", "stock", "codigo"),
            "grupos": ("grupo electrógeno", "generador", "genset", "potencia", "kva"),
            "servicio": ("mantenimiento", "servicio", "visita", "soporte", "correctivo", "preventivo"),
            "logistica": ("plazo", "entrega", "envio", "almacen", "retiro", "despacho"),
            "cotizacion": ("cotiza", "precio", "oferta", "propuesta"),
            "contacto": ("contacto", "correo", "telefono", "whatsapp"),
            "ubicacion": ("donde", "direccion", "local", "sucursal"),
        }

    def respond(self, user_input: str) -> str:
        normalized = user_input.lower().strip()
        if not normalized:
            return "¿En qué puedo ayudarte sobre repuestos o grupos electrógenos?"

        intent = self._detect_intent(normalized)
        if intent == "saludo":
            return random.choice(
                [
                    "¡Hola! Soy el asistente de MODASA. ¿Buscas repuestos, un grupo electrógeno o agendar servicio?",
                    "¡Bienvenido! Puedo cotizar repuestos agrícolas o programar mantenimiento de tu grupo electrógeno.",
                ]
            )
        if intent == "repuestos":
            return self._inventory_answer(normalized)
        if intent == "grupos":
            return self._genset_answer()
        if intent == "servicio":
            return self._service_answer()
        if intent == "logistica":
            return self._logistics_answer()
        if intent == "cotizacion":
            return self._quote_answer()
        if intent == "contacto":
            return self.kb.contact_info
        if intent == "ubicacion":
            return "Estamos en Av. Industrial 123, Lima. También coordinamos envíos a todo el país."

        # Buscador directo por si el cliente pegó un código o descripción
        quick_hits = self.kb.search_inventory(user_input)
        if quick_hits:
            header = "Encontré esto relacionado con tu descripción:\n"
            return header + "\n".join(item.summary() for item in quick_hits[:4])

        return (
            "No entendí completamente tu consulta. Dime si necesitas repuestos, un grupo electrógeno, "
            "o agendar mantenimiento y te ayudo al instante."
        )

    def _detect_intent(self, text: str) -> str:
        best_intent = ""
        best_score = 0
        for intent, keywords in self.intents.items():
            score = sum(text.count(keyword) for keyword in keywords)
            if score > best_score:
                best_intent = intent
                best_score = score
        return best_intent

    def _inventory_answer(self, text: str) -> str:
        hits = self.kb.search_inventory(text)
        if not hits:
            return (
                "Cuéntame el código del repuesto, equipo y marca del motor para ofrecerte la opción más rápida. "
                "Tenemos filtros, correas, inyectores y tableros ATS en stock."
            )
        response_lines = [
            "Repuestos disponibles:",
            *(item.summary() for item in hits[:5]),
            "¿Te cotizo alguno? Si necesitas otro código compártemelo y lo busco.",
        ]
        return "\n".join(response_lines)

    def _genset_answer(self) -> str:
        return textwrap.dedent(
            """
            Podemos ofrecer grupos electrógenos MODASA desde 30 kVA hasta 1250 kVA con motores Perkins, MTU o Volvo.
            Opciones: cabina insonorizada, tablero ATS, monitoreo remoto y kits de arranque automático.
            Indícame potencia requerida, tensión y aplicación (riego, bombeo, backup industrial) para cotizar.
            """
        ).strip()

    def _service_answer(self) -> str:
        return textwrap.dedent(
            f"""
            Tenemos paquetes de servicio:
            {self.kb.list_services()}
            Podemos agendar visita técnica en 48-72 horas según la zona. Comparte ubicación y horas de operación.
            """
        ).strip()

    def _logistics_answer(self) -> str:
        return textwrap.dedent(
            """
            Logística y almacén:
            - Despacho en 24-48h para repuestos en stock desde el almacén de Lima.
            - Envíos asegurados a provincia con seguimiento (Olva, Scharff o transporte asignado).
            - Retiro en almacén con confirmación de orden y guía.
            Comparte RUC y razón social si necesitas factura y guía electrónica.
            """
        ).strip()

    def _quote_answer(self) -> str:
        return textwrap.dedent(
            """
            Puedo preparar una cotización rápida. Envíame:
            - Código o descripción del repuesto / potencia del grupo electrógeno.
            - Cantidad requerida y ubicación de entrega.
            - Datos de facturación (RUC, razón social) si ya los tienes.
            """
        ).strip()


def demo_dialogue(bot: ModasaChatbot) -> str:
    sample_turns = [
        "Hola",
        "Necesito filtro de aire para John Deere",
        "¿Hacen mantenimiento correctivo de grupos?",
        "Cuánto demora el despacho a provincia",
    ]
    lines: List[str] = []
    for turn in sample_turns:
        lines.append(f"Cliente: {turn}")
        lines.append(f"Bot: {bot.respond(turn)}")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Chatbot MODASA en Python puro")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Muestra un diálogo de ejemplo y termina.",
    )
    args = parser.parse_args()

    kb = ModasaKnowledgeBase()
    bot = ModasaChatbot(kb)

    if args.demo:
        print(demo_dialogue(bot))
        return

    print("Asistente MODASA listo. Escribe 'salir' para terminar.")
    while True:
        user_text = input("Tú: ").strip()
        if user_text.lower() in {"salir", "exit", "quit"}:
            print("Bot: ¡Hasta pronto!")
            break
        print(f"Bot: {bot.respond(user_text)}")


if __name__ == "__main__":
    main()
