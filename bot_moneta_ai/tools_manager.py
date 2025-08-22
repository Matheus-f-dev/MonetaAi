import json
from typing import Dict, List, Callable, Any, Iterable
import traceback


class ToolsManager:
    """Gerenciador de tools dinâmico e escalável."""
    
    def __init__(self):
        self.tools: Dict[str, Dict] = {}
        self.handlers: Dict[str, Callable] = {}
    
    def register_tool(self, name: str, schema: Dict, handler: Callable):
        """Registra uma nova tool com seu schema e handler."""
        self.tools[name] = schema
        self.handlers[name] = handler
    
    def get_openai_tools(self) -> List[Dict]:
        """Retorna lista de tools no formato esperado pela OpenAI."""
        return list(self.tools.values())
    
    def process_tool_call(self, tool_call: Dict, account_id: str) -> str:
        """Processa uma chamada de tool e retorna a resposta."""
        try:
            print(f"DEBUG: Processando tool call: {tool_call}")
            print(f"DEBUG: Account ID: {account_id}")
            
            tool_name = tool_call["function"]["name"]
            print(f"DEBUG: Tool name: {tool_name}")
            
            if tool_name not in self.handlers:
                error_response = {
                    "status": "erro",
                    "mensagem": f"Tool '{tool_name}' não encontrada."
                }
                print(f"ERROR: Tool não encontrada: {tool_name}")
                return json.dumps(error_response, ensure_ascii=False)
            
            try:
                # Parse dos argumentos
                args = json.loads(tool_call["function"]["arguments"])
                print(f"DEBUG: Args parseados: {args}")
                
                # Chama o handler específico da tool
                result = self.handlers[tool_name](args, account_id)
                print(f"DEBUG: Resultado da tool: {result}")
                
                return json.dumps(result, ensure_ascii=False)
                
            except Exception as e:
                error_msg = f"Erro ao processar tool '{tool_name}': {str(e)}"
                print(error_msg)
                print(f"Traceback completo:\n{traceback.format_exc()}")
                print(f"DEBUG: Args que causaram erro: {tool_call.get('function', {}).get('arguments', 'N/A')}")
                
                error_response = {
                    "status": "erro",
                    "mensagem": error_msg,
                    "traceback": traceback.format_exc()
                }
                return json.dumps(error_response, ensure_ascii=False)
                
        except Exception as e:
            error_msg = f"Erro crítico no process_tool_call: {str(e)}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            
            error_response = {
                "status": "erro",
                "mensagem": error_msg,
                "traceback": traceback.format_exc()
            }
            return json.dumps(error_response, ensure_ascii=False)


# Instância global do gerenciador
tools_manager = ToolsManager()


# === TOOLS DISPONÍVEIS ===

def handle_registrar_transacoes(args: Dict, account_id: str) -> Dict:
    """Handler para a tool de registrar transações."""
    try:
        print(f"DEBUG: handle_registrar_transacoes chamado com args: {args}, account_id: {account_id}")
        
        from firebase_manager import FireBaseManager
        firebase_manager = FireBaseManager()

        transaction_type = args.get("tipo", "")
        array_transactions = args.get("transacoes", [])
        
        print(f"DEBUG: transaction_type: {transaction_type}")
        print(f"DEBUG: array_transactions: {array_transactions}")

        transaction = firebase_manager.add_transaction(account_id, transaction_type, array_transactions)
        
        # Estrutura correta de resposta
        response = {
            "status": "sucesso",
            "transacoes_adicionadas": transaction
        }
        
        print(f"DEBUG: Response final: {response}")
        return response
        
    except Exception as e:
        error_msg = f"Erro em handle_registrar_transacoes: {str(e)}"
        print(error_msg)
        print(f"Traceback completo:\n{traceback.format_exc()}")
        
        return {
            "status": "erro",
            "mensagem": error_msg,
            "traceback": traceback.format_exc()
        }


# Schema da tool de transações
TOOL_REGISTRAR_TRANSACOES = {
    "type": "function",
    "function": {
        "name": "registrar_transacoes",
        "description": "Registra uma lista de transações financeiras do tipo entrada ou saída.",
        "parameters": {
            "type": "object",
            "properties": {
                "tipo": {
                    "type": "string",
                    "description": "Tipo da transação: 'entrada' para entradas de dinheiro ou 'saida' para saídas de dinheiro.",
                    "enum": ["entrada", "saida"]
                },
                "transacoes": {
                    "type": "array",
                    "description": "Lista de transações financeiras.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "valor": {
                                "type": "number",
                                "description": "Valor da transação."
                            },
                            "descricao": {
                                "type": "string",
                                "description": "Descrição detalhada da transação."
                            },
                            "categoria": {
                                "type": "string",
                                "description": "Categoria da transação (ex: alimentação, salário, venda, transporte)."
                            }
                        },
                        "required": ["valor", "descricao", "categoria"],
                        "additionalProperties": False
                    }
                }
            },
            "required": ["tipo", "transacoes"],
            "additionalProperties": False
        },
        "strict": True
    }
}


def handle_consultar_historico(args: Dict, account_id: str) -> Dict:
    """Handler para a tool de consultar histórico."""
    try:
        print(f"DEBUG: handle_consultar_historico chamado com args: {args}, account_id: {account_id}")
        
        from firebase_manager import FireBaseManager
        firebase_manager = FireBaseManager()
        
        print(f"DEBUG: Chamando get_transactions_history com account_id: {account_id}")
        transactions = firebase_manager.get_transactions_history(account_id)
        print(f"DEBUG: Transactions retornadas: {transactions}")

        response = {
            "transactions": transactions,
            "status": "sucesso"
        }
        
        print(f"DEBUG: Response final: {response}")
        return response
        
    except Exception as e:
        error_msg = f"Erro em handle_consultar_historico: {str(e)}"
        print(error_msg)
        print(f"Traceback completo:\n{traceback.format_exc()}")
        
        return {
            "status": "erro",
            "mensagem": error_msg,
            "traceback": traceback.format_exc()
        }


# Schema da tool de consultar histórico
TOOL_CONSULTAR_HISTORICO = {
  "type": "function",
  "function": {
    "name": "consultar_historico",
    "description": "Consulta o histórico completo de transações financeiras do usuário",
    "parameters": {
      "type": "object",
      "properties": {},
      "required": [],
      "additionalProperties": False
    },
    "strict": True
  }
}


from typing import Dict, Any, List, Iterable
from typing import Dict, Any, List, Iterable

def handle_gerar_relatorio(args: Dict, account_id: str) -> Dict:
    """Handler para a tool de consultar histórico (sem 'filtro_categoria').
    
    Regras do filtro de categorias:
      - Se categorias == []  -> NÃO aplicar filtro (todas)
      - Se categorias == ["todas"] (case-insensitive) -> NÃO aplicar filtro (todas)
      - Caso contrário -> aplicar filtro somente às categorias informadas (case-insensitive)
    """
    try:
        print(f"DEBUG: handle_gerar_relatorio chamado com args: {args}, account_id: {account_id}")
        
        from firebase_manager import FireBaseManager
        firebase_manager = FireBaseManager()
        
        from datetime import datetime, date
        import io, base64
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        print(f"DEBUG: Chamando get_transactions_history com account_id: {account_id}")
        transactions = firebase_manager.get_transactions_history(account_id)
        print(f"DEBUG: Transactions retornadas (qtd={0 if transactions is None else len(transactions)}): {transactions}")

        # ---------- Helpers ----------
        def parse_date_br(d: str) -> date:
            try:
                return datetime.strptime(d, "%d/%m/%Y").date()
            except ValueError as e:
                raise ValueError(f"data inválida (use DD/MM/YYYY): {d}") from e

        def parse_datahora_br(s: str):
            try:
                return datetime.strptime(s, "%d/%m/%Y, %H:%M:%S")
            except Exception:
                return None

        def validar_params(p: Dict[str, Any]) -> None:
            print(f"DEBUG: Validando params: {p}")
            required = ["data_inicio", "data_fim", "categorias"]
            faltando = [k for k in required if k not in p]
            if faltando:
                raise ValueError(f"Parâmetros faltando: {', '.join(faltando)}")
            if not isinstance(p["data_inicio"], str) or not isinstance(p["data_fim"], str):
                raise TypeError("data_inicio e data_fim devem ser strings em DD/MM/YYYY")
            if not isinstance(p["categorias"], list):
                raise TypeError("categorias deve ser uma lista (array) de strings")
            print("DEBUG: Params válidos")

        def normalizar_categorias(lista: List[Any]) -> List[str]:
            # Mantém apenas strings, strip e remove vazios
            norm = []
            for c in lista:
                if c is None:
                    continue
                s = str(c).strip()
                if s:
                    norm.append(s)
            print(f"DEBUG: Categorias normalizadas (origem={lista}) -> {norm}")
            return norm

        def deve_aplicar_filtro(categorias_norm: List[str]) -> bool:
            # Não aplica se vazio ou ["todas"] (case-insensitive)
            if len(categorias_norm) == 0:
                return False
            if len(categorias_norm) == 1 and categorias_norm[0].lower() == "todas":
                return False
            return True

        def filtrar_transacoes(transacoes: Iterable[Dict[str, Any]], dt_ini: date, dt_fim: date, aplicar_filtro_cat: bool, categorias_norm: List[str]) -> List[Dict[str, Any]]:
            print(f"DEBUG: Iniciando filtro | dt_ini={dt_ini}, dt_fim={dt_fim}, aplicar_filtro_cat={aplicar_filtro_cat}, categorias={categorias_norm}")
            set_categorias = {c.lower() for c in categorias_norm} if aplicar_filtro_cat else set()
            out = []
            # contadores de diagnóstico
            total = 0
            sem_data = 0
            fora_periodo = 0
            categoria_excluida = 0

            for t in (transacoes or []):
                total += 1
                dh = t.get("dataHora")
                cat = t.get("categoria", "Sem categoria")
                dt = parse_datahora_br(dh) if isinstance(dh, str) else None
                if dt is None:
                    sem_data += 1
                    continue
                if not (dt_ini <= dt.date() <= dt_fim):
                    fora_periodo += 1
                    continue
                if aplicar_filtro_cat and cat is not None:
                    if cat.strip().lower() not in set_categorias:
                        categoria_excluida += 1
                        continue
                out.append(t)

            print(
                f"DEBUG: Filtro concluído | total={total}, "
                f"mantidas={len(out)}, sem_data={sem_data}, fora_periodo={fora_periodo}, categoria_excluida={categoria_excluida}"
            )
            return out

        def agregar_por_categoria(transacoes: Iterable[Dict[str, Any]]) -> Dict[str, float]:
            print(f"DEBUG: Agregando por categoria (qtd={len(transacoes)})")
            soma = {}
            for t in transacoes:
                cat = t.get("categoria", "Sem categoria")
                valor = t.get("valor", 0)
                try:
                    v = float(valor)
                except Exception:
                    print(f"DEBUG: Valor não numérico ignorado: {valor} em t={t}")
                    continue
                soma[cat] = soma.get(cat, 0.0) + v
            print(f"DEBUG: Agregação concluída | categorias={len(soma)} | detalhes={soma}")
            return soma

        def fmt_brl(v: float) -> str:
            return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

        def gerar_grafico_barras_base64(soma_por_cat: Dict[str, float]) -> str:
            itens = sorted(soma_por_cat.items(), key=lambda kv: kv[1], reverse=True)
            cats = [k for k, _ in itens]
            vals = [v for _, v in itens]
            print(f"DEBUG: Gerando gráfico | categorias={cats} | valores={vals}")

            fig, ax = plt.subplots(figsize=(8, 5), dpi=160)
            if vals:
                bars = ax.bar(cats, vals)
                ax.set_ylabel("Valor")
                ax.set_title("Total por Categoria")
                ax.tick_params(axis='x', rotation=20)
                for b in bars:
                    h = b.get_height()
                    ax.text(b.get_x() + b.get_width()/2.0, h,
                            f"{h:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                            ha='center', va='bottom', fontsize=8)
                ax.grid(axis="y", linestyle=":", linewidth=0.5, alpha=0.6)
            else:
                ax.text(0.5, 0.5, "Sem dados no período/filtro",
                        ha="center", va="center", transform=ax.transAxes)
                ax.set_xticks([]); ax.set_yticks([])
            fig.tight_layout()

            buf = io.BytesIO()
            fig.savefig(buf, format="png", bbox_inches="tight")
            plt.close(fig)
            b64 = base64.b64encode(buf.getvalue()).decode("ascii")
            print(f"DEBUG: Gráfico gerado | base64_len={len(b64)} bytes (caracteres)")
            return b64
        # ---------- Fim helpers ----------

        validar_params(args)
        dt_ini = parse_date_br(args["data_inicio"])
        dt_fim = parse_date_br(args["data_fim"])
        print(f"DEBUG: Datas parseadas | dt_ini={dt_ini} | dt_fim={dt_fim}")
        if dt_ini > dt_fim:
            raise ValueError("data_inicio não pode ser maior que data_fim")
        
        categorias_input = args.get("categorias", [])
        categorias_norm = normalizar_categorias(categorias_input)
        aplicar_filtro_cat = deve_aplicar_filtro(categorias_norm)
        print(f"DEBUG: Resolução do filtro de categorias | aplicar_filtro_cat={aplicar_filtro_cat}")

        # Filtra e agrega
        tx_filtradas = filtrar_transacoes(transactions, dt_ini, dt_fim, aplicar_filtro_cat, categorias_norm)
        print(f"DEBUG: Transações filtradas (qtd={len(tx_filtradas)}): {tx_filtradas}")
        soma_por_cat = agregar_por_categoria(tx_filtradas)
        valor_total = sum(soma_por_cat.values())
        print(f"DEBUG: Valor total agregado={valor_total}")

        # Gera imagem base64
        image_base64 = gerar_grafico_barras_base64(soma_por_cat)
        mime_type = "image/png"

        # Legenda da imagem
        if aplicar_filtro_cat:
            cats_leg = ", ".join(categorias_norm)
            legenda_categorias = f"Categorias: {cats_leg}"
        else:
            legenda_categorias = "Categorias: todas"

        caption = (
            f"Relatório {args['data_inicio']}–{args['data_fim']} | "
            f"{legenda_categorias} | Total: {fmt_brl(valor_total)}"
        )
        print(f"DEBUG: Caption gerado: {caption}")

        # Envio WhatsApp
        from services.whatsapp_service import WhatsAppService
        from session_context import session_context

        ctx = session_context.get_account_context(account_id)

        print(f"DEBUG: ctx: {ctx}")
        wa_id = ctx.get('wa_id')
        phone_number_id = ctx.get('phone_number_id')

        def _mask(s: str) -> str:
            if not s:
                return str(s)
            return f"{s[:4]}***{s[-3:]}" if len(s) > 7 else "***"

        print(f"DEBUG: Contexto WhatsApp | wa_id={_mask(wa_id)} | phone_number_id={_mask(phone_number_id)} | mime_type={mime_type}")
        ws = WhatsAppService()
        print("DEBUG: Enviando imagem via WhatsApp...")
        result = ws.send_image(
            phone_number_id,
            wa_id,
            image_url=None,
            image_base64=image_base64,  # adicione prefixo data: se o serviço exigir
            caption=caption,
            mime_type=mime_type
        )
        print(f"DEBUG: Resultado do envio WhatsApp: {result}")

        response = {
            "status": "sucesso",
            "periodo": {"inicio": args["data_inicio"], "fim": args["data_fim"]},
            "categorias": categorias_norm if aplicar_filtro_cat else "todas",
            "quantidade_transacoes": len(tx_filtradas),
            "valor_total": valor_total,
            "transactions": tx_filtradas,
            "whatsapp_result": result
        }
        
        print(f"DEBUG: Response final: {response}")
        return response
        
    except Exception as e:
        import traceback
        error_msg = f"Erro em handle_gerar_relatorio: {str(e)}"
        print(error_msg)
        print(f"Traceback completo:\n{traceback.format_exc()}")
        
        return {
            "status": "erro",
            "mensagem": error_msg,
            "traceback": traceback.format_exc()
        }


# Schema da tool de consultar histórico
TOOL_GERAR_RELATORIO = {
    "type": "function",
    "function": {
        "name": "gerar_relatorio",
        "description": "gera relatorio das transações financeiras do usuário",
        "parameters": {
            "type": "object",
            "properties": {
                "data_inicio": {
                    "type": "string",
                    "description": "Data de inicio do relatorio no formato DD/MM/YYYY"
                },
                "data_fim": {
                    "type": "string",
                    "description": "Data de fim do relatorio no formato DD/MM/YYYY"
                },
                "categorias": {
                    "type": "array",
                    "description": "caso o cliente quiser gerar um relatorio de algumas categorias especificas, retorne uma lista de categoria das transações (ex: alimentação, salário, venda, transporte)..",
                    "items": {
                        "type": "string"
                    }
                }
            },
            "required": ["data_inicio", "data_fim", "categorias"],
            "additionalProperties": False
        },
        "strict": True
    }
}



"""
from services.whatsapp_service import WhatsAppService
from session_context import session_context

ctx = session_context.get_account_context(account_id)
wa_id = ctx.get('wa_id')
phone_number_id = ctx.get('phone_number_id')
ws = WhatsAppService()
result = ws.send_image(phone_number_id, wa_id, image_url=None, image_base64=image_base64, caption=caption, mime_type=mime_type)
"""

# === REGISTRO DAS TOOLS ===

def initialize_tools():
    """Inicializa e registra todas as tools disponíveis."""
    
    # Registra tool de transações
    tools_manager.register_tool(
        "registrar_transacoes",
        TOOL_REGISTRAR_TRANSACOES,
        handle_registrar_transacoes
    )
    
    # Registra tool de consulta de historico
    tools_manager.register_tool(
        "consultar_historico",
        TOOL_CONSULTAR_HISTORICO,
        handle_consultar_historico
    )

    # Registra tool de consulta de historico
    tools_manager.register_tool(
        "gerar_relatorio",
        TOOL_GERAR_RELATORIO,
        handle_gerar_relatorio
    )

    # Para adicionar novas tools, basta registrar aqui:
    # tools_manager.register_tool("nome_da_tool", SCHEMA_DA_TOOL, handler_function)


# Inicializa as tools automaticamente quando o módulo é importado
initialize_tools()
