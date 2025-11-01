from datetime import datetime
from firebase_admin import credentials, firestore
import firebase_admin
import traceback

class FireBaseManager:
    def __init__(self):
        try:
            firebase_admin.get_app()
        except ValueError:
            cred = credentials.Certificate("./serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        
        self.firestore = firestore.client()
        
    def get_transactions_history(self, account_id):
        """Recupera o histórico do usuário."""
        try:
            historico_ref = (
                self.firestore
                .collection('usuarios')
                .document(account_id)
                .collection('historico')
            )
            docs = historico_ref.stream()

            registros = []
            for doc in docs:
                dados = doc.to_dict()
                dados['id'] = doc.id
                registros.append(dados)
            return registros
                        
        except Exception as e:
            error_msg = f"Erro ao recuperar histórico usuario: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return []
    
    def add_transaction(self, account_id, transaction_type, array_transactions):
        """Adiciona nova transacao."""
        try:
            print(f"DEBUG Firebase: account_id={account_id}, tipo={transaction_type}")
            print(f"DEBUG Firebase: array_transactions={array_transactions}")
            
            # Gera timestamp
            data_hora = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
            retorno_registro = []

            # Corrigindo a iteração - array_transactions deve ser uma lista
            if isinstance(array_transactions, list):
                for t in array_transactions:
                    print(f"DEBUG Firebase: Processando transação: {t}")
                    
                    value = t.get("valor")
                    category = t.get("categoria") 
                    description = t.get("descricao")
                    name = t.get("nome")
                    
                    print(f"DEBUG Firebase: valor={value}, categoria={category}, descricao={description}, nome={name}")

                    historico_ref = (
                        self.firestore
                        .collection('usuarios')
                        .document(account_id)
                        .collection('historico')
                    )
                    # Cria um documento com ID automático
                    doc_ref = historico_ref.document()

                    registro = {
                        "id": doc_ref.id,
                        "valor": value,
                        "categoria": category,
                        "dataHora": data_hora,
                        "tipo": transaction_type,
                        "descricao": description,
                        "nome": name
                    }

                    retorno_registro.append(registro)
                    
                    print(f"DEBUG Firebase: Salvando registro: {registro}")
                    # Grava no Firestore
                    doc_ref.set(registro)
            else:
                # Se for um dict (formato antigo), converte
                print("DEBUG Firebase: Convertendo formato antigo de dict para lista")
                for key, t in array_transactions.items():
                    print(f"DEBUG Firebase: Processando transação key={key}: {t}")
                    
                    value = t.get("valor")
                    category = t.get("categoria")
                    description = t.get("descricao")
                    
                    historico_ref = (
                        self.firestore
                        .collection('usuarios')
                        .document(account_id)
                        .collection('historico')
                    )
                    # Cria um documento com ID automático
                    doc_ref = historico_ref.document()

                    registro = {
                        "id": doc_ref.id,
                        "valor": value,
                        "categoria": category,
                        "dataHora": data_hora,
                        "tipo": transaction_type,
                        "descricao": description
                    }

                    retorno_registro.append(registro)
                    
                    print(f"DEBUG Firebase: Salvando registro: {registro}")
                    # Grava no Firestore
                    doc_ref.set(registro)
                
            print(f"DEBUG Firebase: Retornando {len(retorno_registro)} registros")
            return retorno_registro
            
        except Exception as e:
            error_msg = f"Erro ao salvar transacao: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return False